import { URL } from 'url';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import moment from 'moment-timezone';
import { WebDriver, By } from 'selenium-webdriver';

@Injectable()
export class MoodleService {
  private url: string;
  constructor(config: ConfigService) {
    this.url = <string>config.get('bot.moodle.url');
  }

  public async checkLogin(username: string, password: string, driver: WebDriver) {
    return this.login(username, password, driver);
  }

  public async getUpcomingEvents(username: string, password: string, driver: WebDriver) {
    const { error: loginError } = await this.login(username, password, driver);

    if (loginError) return { events: [], error: loginError };

    try {
      await driver.get(`${this.url}/calendar/view.php?view=upcoming`);
      const eventsEl = await driver.findElements(By.className('event'));
      const events = [];
      for (const event of eventsEl) {
        const [title, rows, footer] = [
          await event.getAttribute('data-event-title'),
          await event.findElements(By.className('col-11')),
          await event.findElement(By.xpath("//div[@class='card-footer text-right bg-transparent']")),
        ];

        const dateContainerEl = rows[0];
        const courseContainerNameEl = rows[rows.length - 1];

        const dateEl = await dateContainerEl.findElement(By.xpath('.//a'));
        const courseNameEl = await courseContainerNameEl.findElement(By.xpath('.//a'));
        const linkEl = await footer.findElement(By.xpath('.//a'));

        events.push({
          title,
          date: this.parseDate(await dateEl.getAttribute('href')),
          link: await linkEl.getAttribute('href'),
          courseTitle: await courseNameEl.getText(),
          eventId: await event.getAttribute('data-event-id'),
        });
      }

      return { events, error: null };
    } catch (err) {
      return { events: [], error: (<Error>err).message };
    }
  }

  // public async logout(driver: WebDriver) {
  //   try {
  //     await driver.get(`${this.url}/login/logout.php`);
  //     const form = await driver.findElement(By.xpath('.//form'));
  //     await form.submit();
  //     return { error: null };
  //   } catch (err) {
  //     return {
  //       error: 'Failed to authenticate',
  //     };
  //   }
  // }

  private async login(username: string, password: string, driver: WebDriver) {
    try {
      await driver.get(`${this.url}/login/index.php`);
      const usernameField = await driver.findElement(By.id('username'));
      const passwordField = await driver.findElement(By.id('password'));
      // already logged in
      if (!usernameField || !passwordField) {
        return { error: null };
      }
      // clear fields
      await usernameField.clear();
      await passwordField.clear();

      // input user creds
      await usernameField.sendKeys(username);
      await passwordField.sendKeys(password);

      // find login button and click
      const button = await driver.findElement(By.id('loginbtn'));
      await button.click();

      // check if there is error
      const errorElements = await driver.findElements(By.id('loginerrormessage'));

      if (errorElements.length !== 0) {
        const error = await errorElements[0].getText();
        return { error };
      }
      // if not error, success
      return { error: null };
    } catch (err) {
      console.error(err);
      return { error: (<Error>err).message };
    }
  }

  private parseDate(link: string) {
    const unix = new URL(link).searchParams.get('time');
    return moment.unix(Number(unix)).toDate();
  }
}
