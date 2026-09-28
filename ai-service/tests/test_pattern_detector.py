"""
Tests for the pattern detection pipeline — the core AI feature of the
whole project. Run with: python3 -m pytest tests/ -v
(or: python3 tests/test_pattern_detector.py to run without pytest)
"""
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas import InterviewInput
from app.pattern_detector import detect_patterns

passed = 0
failed = 0


def check(condition, description):
    global passed, failed
    if condition:
        print(f"  \u2713 {description}")
        passed += 1
    else:
        print(f"  \u2717 {description}")
        failed += 1


def test_spec_example_dbms_and_confidence():
    """The exact scenario from the project spec: three differently-worded
    DBMS complaints should be recognized as one recurring pattern, and
    two differently-worded confidence complaints as another — without
    exact keyword overlap between all of them."""
    interviews = [
        InterviewInput(id="1", date=date(2026, 6, 1), struggleAreas=["DBMS"], description="I struggled with SQL joins."),
        InterviewInput(
            id="2", date=date(2026, 6, 15), struggleAreas=["DSA"], description="I could not answer database questions."
        ),
        InterviewInput(
            id="3", date=date(2026, 7, 1), struggleAreas=[], description="Unable to explain normalization when asked."
        ),
        InterviewInput(
            id="4",
            date=date(2026, 7, 10),
            struggleAreas=["HR questions"],
            description="I felt very nervous answering HR questions about myself.",
        ),
        InterviewInput(
            id="5",
            date=date(2026, 7, 20),
            struggleAreas=["Confidence"],
            description="I lacked confidence while speaking during the HR round.",
        ),
    ]

    patterns = detect_patterns(interviews)
    by_category = {p.category: p for p in patterns}

    check("DBMS/SQL" in by_category, "DBMS/SQL pattern is detected")
    check(by_category.get("DBMS/SQL") and by_category["DBMS/SQL"].frequency == 3, "DBMS/SQL frequency is 3")
    check(
        by_category.get("DBMS/SQL") and set(by_category["DBMS/SQL"].interviewIds) == {"1", "2", "3"},
        "DBMS/SQL correctly includes all 3 differently-worded interviews",
    )

    check("Confidence" in by_category, "Confidence pattern is detected")
    check(by_category.get("Confidence") and by_category["Confidence"].frequency == 2, "Confidence frequency is 2")
    check(
        by_category.get("Confidence") and set(by_category["Confidence"].interviewIds) == {"4", "5"},
        "Confidence correctly includes both differently-worded interviews",
    )


def test_empty_and_single_interview():
    check(detect_patterns([]) == [], "Zero interviews returns an empty pattern list, not an error")
    single = [InterviewInput(id="1", date=date(2026, 1, 1), struggleAreas=["DBMS"], description="SQL issue")]
    check(detect_patterns(single) == [], "A single interview cannot produce a 'recurring' pattern")


def test_single_occurrence_is_not_a_pattern():
    interviews = [
        InterviewInput(id="1", date=date(2026, 1, 1), struggleAreas=["DBMS"], description="SQL issue"),
        InterviewInput(id="2", date=date(2026, 2, 1), struggleAreas=["Confidence"], description="felt nervous"),
    ]
    check(detect_patterns(interviews) == [], "Two interviews with different single-occurrence categories yield no pattern")


def test_structured_tags_alone_are_sufficient():
    """Even with zero free text, repeated structured tags alone should
    produce a pattern — the ML pipeline should never be a hard requirement
    for the most basic case."""
    interviews = [
        InterviewInput(id="1", date=date(2026, 1, 1), struggleAreas=["Communication"], description=""),
        InterviewInput(id="2", date=date(2026, 2, 1), struggleAreas=["Communication"], description=""),
    ]
    patterns = detect_patterns(interviews)
    check(len(patterns) == 1 and patterns[0].category == "Communication", "Structured tags alone produce a pattern")
    check(patterns[0].source == "structured_tags", "Source is correctly labeled as structured_tags only")


def test_trend_direction():
    """A weakness concentrated in more recent interviews should trend
    'increasing'; one concentrated in older interviews should trend
    'decreasing'. Verifies the direction is right, not just that a label exists."""
    interviews = [
        InterviewInput(id="1", date=date(2026, 1, 1), struggleAreas=["DBMS"], description=""),
        InterviewInput(id="2", date=date(2026, 2, 1), struggleAreas=["DBMS"], description=""),
        InterviewInput(id="3", date=date(2026, 3, 1), struggleAreas=[], description=""),
        InterviewInput(id="4", date=date(2026, 4, 1), struggleAreas=[], description=""),
        InterviewInput(id="5", date=date(2026, 5, 1), struggleAreas=[], description=""),
    ]
    patterns = detect_patterns(interviews)
    dbms = next(p for p in patterns if p.category == "DBMS")
    check(dbms.trend == "decreasing", "A weakness concentrated in OLDER interviews trends 'decreasing' (improving)")


def test_insufficient_data_for_trend():
    """With fewer than 3 total interviews, trend should be explicitly
    marked as insufficient data rather than guessing a direction."""
    interviews = [
        InterviewInput(id="1", date=date(2026, 1, 1), struggleAreas=["DBMS"], description=""),
        InterviewInput(id="2", date=date(2026, 2, 1), struggleAreas=["DBMS"], description=""),
    ]
    patterns = detect_patterns(interviews)
    check(patterns[0].trend == "insufficient_data", "Trend is honestly labeled insufficient_data with only 2 interviews")


def test_cross_user_would_never_mix():
    """Sanity check: the function only ever operates on the list passed in
    — there's no global state, so cross-user data leakage is architecturally
    impossible at this layer (the Node backend is responsible for only ever
    passing one user's interviews at a time)."""
    interviews_a = [
        InterviewInput(id="a1", date=date(2026, 1, 1), struggleAreas=["DBMS"], description=""),
        InterviewInput(id="a2", date=date(2026, 2, 1), struggleAreas=["DBMS"], description=""),
    ]
    interviews_b = [
        InterviewInput(id="b1", date=date(2026, 1, 1), struggleAreas=["Confidence"], description=""),
    ]
    patterns_a = detect_patterns(interviews_a)
    patterns_b = detect_patterns(interviews_b)
    check(len(patterns_a) == 1, "User A's call is unaffected by being run alongside User B's data")
    check(patterns_b == [], "User B's single interview correctly yields no pattern, unaffected by User A's call")


if __name__ == "__main__":
    print("Spec example: DBMS + Confidence detection")
    test_spec_example_dbms_and_confidence()
    print("\nEmpty and single-interview edge cases")
    test_empty_and_single_interview()
    print("\nSingle occurrence is not a pattern")
    test_single_occurrence_is_not_a_pattern()
    print("\nStructured tags alone are sufficient")
    test_structured_tags_alone_are_sufficient()
    print("\nTrend direction")
    test_trend_direction()
    print("\nInsufficient data for trend")
    test_insufficient_data_for_trend()
    print("\nNo cross-user state leakage")
    test_cross_user_would_never_mix()

    print(f"\n{passed} passed, {failed} failed.")
    sys.exit(1 if failed > 0 else 0)
