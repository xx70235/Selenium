package main;

import java.util.List;
import java.util.Random;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.Select;

public class AddFaver {
  private WebDriver driver;
  private String baseUrl;
  private boolean acceptNextAlert = true;
  private StringBuffer verificationErrors = new StringBuffer();

  @Before
  public void setUp() throws Exception {
    driver = new FirefoxDriver();
    baseUrl = "http://www.ipaofu.com/";
    driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
  }

  @Test
  public void testFen() throws Exception {
     Random r = new Random();
    driver.get(baseUrl + "/user/login");
    driver.findElement(By.name("email_name")).clear();
    driver.findElement(By.name("email_name")).sendKeys("test@gmail.com");
    driver.findElement(By.name("pass")).clear();
    driver.findElement(By.name("pass")).sendKeys("111111");
    driver.findElement(By.id("login_submit")).click();
    driver.findElement(By.linkText("Ëæ±ã¹ä¹ä")).click();
    List<WebElement> eles = driver.findElements(By.cssSelector("div.addfo > a > img"));
    System.out.println(eles.size());
    for(int i = 0;i<r.nextInt(eles.size());i++)
    {
        eles.get(r.nextInt(eles.size())).click();
    }
//    driver.findElement(By.cssSelector("div.addfo > a > img")).click();
    List<WebElement> eles1 = driver.findElements(By.cssSelector("a.add_fav.fav"));
    System.out.println(eles1.size());
    for(int i = 0;i<r.nextInt(eles1.size());i++)
    {
        eles1.get(r.nextInt(eles1.size())).click();
    }
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

  private String closeAlertAndGetItsText() {
    try {
      Alert alert = driver.switchTo().alert();
      if (acceptNextAlert) {
        alert.accept();
      } else {
        alert.dismiss();
      }
      return alert.getText();
    } finally {
      acceptNextAlert = true;
    }
  }
  
  static public void main(String[] args)
  {
      AddFaver ipr = new AddFaver();
      try
      {
          ipr.setUp();
//          ipr.getDBconnect();
          ipr.testFen();
      }
      catch (Exception e)
      {
          // TODO Auto-generated catch block
          e.printStackTrace();
      }

  }
}
