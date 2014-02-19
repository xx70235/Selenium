

import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.Select;

public class AlibabaHangye {
  private WebDriver driver;
  private String baseUrl;
  private boolean acceptNextAlert = true;
  private StringBuffer verificationErrors = new StringBuffer();

  @Before
  public void setUp() throws Exception {
    driver = new FirefoxDriver();
    baseUrl = "http://top.china.alibaba.com/";
    driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
  }

  @Test
  public void testAlibabaHangye() throws Exception {
    driver.get(baseUrl + "/trade/company/company.htm?spm=a260j.615.5095975.343");
    driver.findElement(By.xpath("//div[@id='content']/div/ul/li[2]/div[2]/div/dl/dt/a")).click();
    driver.findElement(By.xpath("//div[@id='content']/div/ul/li[3]/div/a")).click();
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
      AlibabaHangye ali = new AlibabaHangye();
      try
      {
          ali.setUp();
          ali.testAlibabaHangye();
      }
      catch (Exception e)
      {
          // TODO Auto-generated catch block
          e.printStackTrace();
      }

  }
  
}
