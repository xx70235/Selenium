package action;

import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;

import models.CardModel;

import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.Select;

public class FinalPageWP {
  private WebDriver driver;
  private String baseUrl;
  private boolean acceptNextAlert = true;
  private StringBuffer verificationErrors = new StringBuffer();
  private CardModel cardModel;

  @Before
  public void setUp() throws Exception {
    driver = new FirefoxDriver();
    baseUrl = "http://wpengine.com/";
    driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
  }

  
  public FinalPageWP(WebDriver driver, CardModel model)
  {
      this.driver = driver;
      this.cardModel = model;
  }
  
  @Test
  public void emuAction() throws Exception {
//    driver.get(baseUrl + "/?SSAID=863409");

    driver.findElement(By.id("billing_info_phone")).clear();
    driver.findElement(By.id("billing_info_phone")).sendKeys(cardModel.getTelnum());
    driver.findElement(By.id("billing_info_number")).clear();
    driver.findElement(By.id("billing_info_number")).sendKeys(cardModel.getCardnum());
    driver.findElement(By.id("billing_info_verification_value")).clear();
    driver.findElement(By.id("billing_info_verification_value")).sendKeys(cardModel.getCvv());
//    new Select(driver.findElement(By.id("billing_info_month"))).selectByVisibleText("06 - June");
//    new Select(driver.findElement(By.id("billing_info_year"))).selectByVisibleText("2015");
    driver.findElement(By.id("billing_info_address1")).clear();
    driver.findElement(By.id("billing_info_address1")).sendKeys(cardModel.getAddr());
    driver.findElement(By.id("billing_info_city")).clear();
    driver.findElement(By.id("billing_info_city")).sendKeys(cardModel.getCity());
    driver.findElement(By.id("billing_info_state")).clear();
    driver.findElement(By.id("billing_info_state")).sendKeys(cardModel.getState());
    driver.findElement(By.id("billing_info_zip")).clear();
    driver.findElement(By.id("billing_info_zip")).sendKeys(cardModel.getZipcode());
//    new Select(driver.findElement(By.id("billing_info_country"))).selectByVisibleText("United States");
//    driver.findElement(By.id("pay-creditcard")).click();
  }

  @After
  public void tearDown() throws Exception {
    driver.quit();
    String verificationErrorString = verificationErrors.toString();
    if (!"".equals(verificationErrorString)) {
      fail(verificationErrorString);
    }
  }

  private boolean isElementPresent(By by) {
    try {
      driver.findElement(by);
      return true;
    } catch (NoSuchElementException e) {
      return false;
    }
  }

  private boolean isAlertPresent() {
    try {
      driver.switchTo().alert();
      return true;
    } catch (NoAlertPresentException e) {
      return false;
    }
  }

  private String closeAlertAndGetItsText() {
    try {
      Alert alert = driver.switchTo().alert();
      String alertText = alert.getText();
      if (acceptNextAlert) {
        alert.accept();
      } else {
        alert.dismiss();
      }
      return alertText;
    } finally {
      acceptNextAlert = true;
    }
  }
}
