Feature: Technical foundation smoke check

  Scenario: The generated API contract is served by the runtime
    When the technical shell is opened
    Then the shell reports that the infrastructure is healthy
