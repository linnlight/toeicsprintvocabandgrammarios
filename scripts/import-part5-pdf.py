#!/usr/bin/env python3
"""Extract the supplied two-column Part 5 workbook into validated app JSON."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pdfplumber


QUESTION_RE = re.compile(r"(?m)^(\d{1,2})\.\s+")
OPTION_RE = re.compile(r"(?ms)^\(([A-D])\)\s*(.*?)(?=^\([A-D]\)\s|\Z)")


def normalize(value: str) -> str:
    value = re.sub(r"-{5,}", "_____", value)
    return re.sub(r"\s+", " ", value).strip()


def parse_column(text: str) -> list[dict[str, object]]:
    text = re.sub(r"(?m)^Test \d+.*$", "", text)
    matches = list(QUESTION_RE.finditer(text))
    questions: list[dict[str, object]] = []

    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.end():end].strip()
        option_matches = list(OPTION_RE.finditer(block))
        if len(option_matches) != 4:
            raise ValueError(f"Question {match.group(1)} has {len(option_matches)} options")

        prompt = normalize(block[:option_matches[0].start()])
        options: list[str] = []
        correct_indexes: list[int] = []
        for option_index, option_match in enumerate(option_matches):
            raw_option = normalize(option_match.group(2))
            if "*" in raw_option:
                correct_indexes.append(option_index)
            options.append(raw_option.replace("*", "").strip())

        if len(correct_indexes) != 1:
            raise ValueError(
                f"Question {match.group(1)} has {len(correct_indexes)} marked answers"
            )
        if not prompt or any(not option for option in options):
            raise ValueError(f"Question {match.group(1)} has empty content")

        questions.append({
            "number": int(match.group(1)),
            "prompt": prompt,
            "options": options,
            "correctIndex": correct_indexes[0],
        })

    return questions


def extract(source: Path) -> list[dict[str, object]]:
    tests: list[dict[str, object]] = []
    with pdfplumber.open(source) as pdf:
        if len(pdf.pages) != 40:
            raise ValueError(f"Expected 40 pages, found {len(pdf.pages)}")

        for test_index in range(10):
            questions: list[dict[str, object]] = []
            for page_offset in range(4):
                page_index = test_index * 4 + page_offset
                page = pdf.pages[page_index]
                top = 100 if page_offset == 0 else 55
                bottom = page.height - 35
                left = page.crop((0, top, page.width / 2, bottom))
                right = page.crop((page.width / 2, top, page.width, bottom))

                page_questions = parse_column(
                    left.extract_text(x_tolerance=2, y_tolerance=3) or ""
                ) + parse_column(
                    right.extract_text(x_tolerance=2, y_tolerance=3) or ""
                )
                page_questions.sort(key=lambda question: int(question["number"]))

                expected_numbers = list(
                    range(page_offset * 10 + 1, page_offset * 10 + 11)
                )
                actual_numbers = [int(question["number"]) for question in page_questions]
                if actual_numbers != expected_numbers:
                    raise ValueError(
                        f"Page {page_index + 1}: expected {expected_numbers}, got {actual_numbers}"
                    )

                for question in page_questions:
                    number = int(question["number"])
                    question.update({
                        "id": f"part5-t{test_index + 1:02d}-q{number:02d}",
                        "sourceId": "part5-003",
                        "sourceLocator": (
                            f"003.pdf p.{page_index + 1}, "
                            f"Test {test_index + 1} Q{number}"
                        ),
                    })
                questions.extend(page_questions)

            if len(questions) != 40:
                raise ValueError(f"Test {test_index + 1} has {len(questions)} questions")

            tests.append({
                "id": f"part5-test-{test_index + 1:02d}",
                "number": test_index + 1,
                "titleJa": f"Part 5 テスト {test_index + 1}",
                "titleEn": f"Part 5 Test {test_index + 1}",
                "questions": questions,
            })

    ids = [question["id"] for test in tests for question in test["questions"]]
    if len(ids) != 400 or len(set(ids)) != 400:
        raise ValueError("Expected 400 unique question IDs")
    return tests


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    tests = extract(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(tests, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Imported {len(tests)} tests and 400 questions into {args.output}")


if __name__ == "__main__":
    main()
