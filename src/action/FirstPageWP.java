package action;

import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;

import models.CardModel;

import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class FirstPageWP {
  private WebDriver driver;
  private String baseUrl;
  private boolean acceptNextAlert = true;
  private StringBuffer verificationErrors = new StringBuffer();
  private CardModel cardModel;
  
//  @Before
//  public void setUp() throws Exception {
//    driver = new FirefoxDriver();
//    baseUrl = "http://wpengine.com";
//    driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
//  }
  
  public FirstPageWP(WebDriver driver, CardModel model)
  {
      this.driver = driver;
      this.cardModel = model;
      baseUrl = "http://www.selectyourgoods.com";
  }
  

  @Test
  public void emuAction() throws Exception {
      
    //TODO:少了从主页到达定制页的步骤
    driver.get(baseUrl + "/id168.php");
//    driver.findElement(
//            By.xpath("//a[contains(@href, 'https://signup.wpengine.com/?plan_id=personal&coupon=')]")).click();
//    WebDriverWait wait = new WebDriverWait(driver, 30);
//    WebElement element = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[contains(@href, 'https://signup.wpengine.com/?plan_id=personal&coupon=')]")));
//    element.click();
//    driver.findElement(By.linkText("Host My Website")).click();
    driver.findElement(By.id("form_fname")).clear();
    driver.findElement(By.id("form_fname")).sendKeys(cardModel.getFname());
    driver.findElement(By.id("form_lname")).clear();
    driver.findElement(By.id("form_lname")).sendKeys(cardModel.getLname());
    driver.findElement(By.id("form_email")).clear();
    driver.findElement(By.id("form_email")).sendKeys(cardModel.getEmail());
    driver.findElement(By.id("form_password")).clear();
    driver.findElement(By.id("form_password")).sendKeys(cardModel.getPassword());
    driver.findElement(By.id("form_confirm_password")).clear();
    driver.findElement(By.id("form_confirm_password")).sendKeys(cardModel.getPassword());
    driver.findElement(By.id("form_account_name")).clear();
    driver.findElement(By.id("form_account_name")).sendKeys(cardModel.getAccName());
    driver.findElement(By.id("form_howdyahear")).clear();
    driver.findElement(By.id("form_howdyahear")).sendKeys("twitter");
    
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
