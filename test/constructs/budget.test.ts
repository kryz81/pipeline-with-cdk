import { App, Stack } from "aws-cdk-lib";
import { Budget } from "../../lib/constructs/budget";
import { Match, Template } from "aws-cdk-lib/assertions";

test("budget construct", () => {
  // given
  const app = new App();
  const stack = new Stack(app, "stack");

  // when
  new Budget(stack, "budget", {
    budgetAmount: 5,
    emailAddress: "kryz81@proton.me",
  });

  // then
  Template.fromStack(stack).hasResourceProperties("AWS::Budgets::Budget", {
    Budget: {
      BudgetLimit: {
        Amount: 5,
      },
    },
    NotificationsWithSubscribers: [
      Match.objectLike({
        subscribers: [
          { Address: "kryz81@proton.me", SubscriptionType: "EMAIL" },
        ],
      }),
    ],
  });
});
