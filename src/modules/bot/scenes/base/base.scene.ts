import { UseFilters } from '@nestjs/common';
import { I18n, I18nService } from 'nestjs-i18n';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';

@UseFilters(TelegrafExceptionFilter)
export class BaseScene {
  constructor(@I18n() private i18n: I18nService) {}

  protected get commonMessages() {
    return this.getMessage<Record<string, string>>('common');
  }

  protected async runStep(ctx: Scenes.WizardContext, next: () => Promise<void>, newStep: number) {
    const { step } = this.setStep(ctx, newStep);
    if (typeof step === 'function') await step(ctx, next);
  }

  protected setStep(ctx: Scenes.WizardContext, newStep: number) {
    // set prev step, so the next running step will be current step
    return ctx.wizard.selectStep(newStep - 1);
  }

  protected getMessage<T = string>(key: string, args?: Record<string, any>) {
    return this.i18n.translate<T>(key, { args });
  }

  protected setState(ctx: Scenes.WizardContext, key: string, value: any) {
    (<any>ctx).wizard.state[key] = value;
  }

  protected getState<T = any>(ctx: Scenes.WizardContext) {
    return <T>(<any>ctx).wizard.state;
  }

  protected getCallbackData(ctx: Scenes.WizardContext) {
    return <string>ctx.callbackQuery!.data;
  }

  protected getCallbackMessage(ctx: Scenes.WizardContext) {
    return <string>(<any>ctx.callbackQuery).message.text;
  }

  protected getCallbackPayload(ctx: Scenes.WizardContext, prefix: string) {
    const callbackData = this.getCallbackData(ctx);
    return callbackData.replace(prefix, '');
  }

  protected async leaveScene(ctx: Scenes.WizardContext) {
    return ctx.scene.leave();
  }

  protected nextStep(ctx: Scenes.WizardContext) {
    ctx.wizard.next();
  }
}
