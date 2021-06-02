import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SoracomButtonIntegrateLineWorksMessageBotExample from '../lib/soracom-button-integrate-line-works-message-bot-example-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SoracomButtonIntegrateLineWorksMessageBotExample.SoracomButtonIntegrateLineWorksMessageBotExampleStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
