import { Injectable } from '@nestjs/common';
import { WebDriver, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';

@Injectable()
export class DriverService {
  public async withDriver<T = any>(
    cb: (driver: WebDriver) => Promise<T>,
  ) {
    const driver = await this.getDriverInstance();

    if (!driver) return { error: 'Driver not working' };

    try {
      return await cb(driver);
    } catch (err) {
      return { error: 'Error while using driver' };
    } finally {
      await this.quitDriver(driver, 2);
    }
  }

  private async quitDriver(driver: WebDriver, retry?: number): Promise<void> {
    try {
      await driver.quit();
    } catch (err) {
      if (retry && !Number.isNaN(retry) && retry > 0) {
        return this.quitDriver(driver, retry - 1);
      }
    }
  }

  private getDriverInstance() {
    try {
      const screen = {
        width: 640,
        height: 480,
      };

      const options = new firefox.Options();
      options.setAcceptInsecureCerts(true);

      return new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options.windowSize(screen))
        .build();
    } catch (err) {
      return null;
    }
  }
}
