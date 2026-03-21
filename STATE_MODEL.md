# State Model — ProofDesk

Entities:

Epic
Feature
Function
TestCase
ReleaseState

Function statuses:

devStatus:
not_started
in_progress
built
partial
blocked

testStatus:
not_tested
ready_to_test
passed
failed

acceptanceStatus:
in_scope
under_review
accepted
rejected

Allowed transitions:

devStatus:
not_started → in_progress → built

testStatus:
not_tested → ready_to_test → passed / failed

acceptanceStatus:
under_review → accepted / rejected

Release readiness rule:

Release allowed when:

priority == high
AND
testStatus == passed
AND
acceptanceStatus == accepted

Agent decision matrix:

approved_for_release == false → BLOCK

blocking_functions > 0 → BLOCK

else → COMMIT_ALLOWED
