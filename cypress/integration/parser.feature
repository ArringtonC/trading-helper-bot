Feature: IBKR Activity Statement Parser
  As a trader
  I want to parse IBKR activity statements accurately
  So that I can see correct P&L values in my dashboard

  Background:
    Given I have loaded the sample CSV file "sample-30.csv"

  Scenario: Parse individual trade P&L values
    When I parse the AAPL trade row
    Then the realizedPL should be 98.877711
    And the mtmPL should be 13.34
    And the tradePL should be 112.217711

  Scenario: Extract cumulative P&L from Performance Summary
    When I locate the Performance Summary section
    And I find the 10th numeric field after "Total"
    Then the cumulativePL should be 1629.822617

  Scenario: Display P&L values in dashboard
    Given I have loaded the dashboard with sample data
    When I look at the header cards
    Then the "Total P&L" should show "$1,629.82"
    And the first three trades in the table should show:
      | Symbol | P&L      |
      | AAPL   | $112.22  |
      | SPY    | $53.34   |
      | TSLA   | $48.92   | 