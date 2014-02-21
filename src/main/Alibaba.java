package main;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.UnreachableBrowserException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class Alibaba
{
    private WebDriver driver;
    private String baseUrl;
    private boolean acceptNextAlert = true;
    private StringBuffer verificationErrors = new StringBuffer();

    @Before
    public void setUp() throws Exception
    {
        driver = new FirefoxDriver();
//        baseUrl = "http://s.1688.com/";
        driver.manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);
    }

    public void testAlibaba() throws Exception
    {
        ArrayList<String> keywords = getKeywords("keywordlist.txt");
        WebDriverWait wait = new WebDriverWait(driver, 20);
        for(String keyword : keywords)
        {
            String url  = "http://search.china.alibaba.com/company/"+keyword+".html?province=%B9%E3%B6%AB&memberlevel=pm&showStyle=noimg&filt=y";
            driver.get(url);
            
            int page = 0;
            WebElement element = null;
            BufferedWriter output = new BufferedWriter(new FileWriter(keyword+".txt"));
            do
            {
                
//                WebElement myDynamicElement = (new WebDriverWait(driver, 10))
//                        .until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("a.Title")));
                for (WebElement tmp : driver.findElements(By.cssSelector("a.Title")))
                {
                    System.out.println(tmp.getText() + ": "
                            +" keyword: "+ keyword+ "   page: "+(page+1));
                    output.write(tmp.getAttribute("href")+"\n");
                }
//                Thread.sleep(5000);
//                element = driver.findElement(By.xpath("//a[contains(text(),'下一页')]"));
//                System.out.println(element.getText() + ": " + element.getAttribute("href"));
                try {
                element =  wait.until( ExpectedConditions.elementToBeClickable(By.linkText("下一页")));
                element.click();
                page++;
                }
                catch(TimeoutException e)
                {
                    element = null;
                    
                }
                catch(NoSuchElementException e1)
                {
                    element = null;
                }
                catch(UnreachableBrowserException e2)
                {
                    element = null;
                }
                catch(StaleElementReferenceException e3)
                {
                    element = null;
                }
            }
            while (element != null);
            output.close();
        }
        
       
//        driver.findElement(By.linkText("公司")).click();
//        driver.findElement(By.id("j_q")).clear();
//        driver.findElement(By.id("j_q")).sendKeys("连衣裙");
//        driver.findElement(By.id("j_b")).click();
//        WebElement select = driver.findElement(By.tagName("select"));
//        String handler = driver.getWindowHandle();
//        Set<String> set = driver.getWindowHandles();
//        for (String newHandle : set)
//        {
//            if (!newHandle.equals(handler))
//            {
//                driver.switchTo().window(newHandle);
//                break;
//            }
//        }
      
        
        
    }

    @After
    public void tearDown() throws Exception
    {
        driver.quit();
        String verificationErrorString = verificationErrors.toString();
        if (!"".equals(verificationErrorString))
        {
            fail(verificationErrorString);
        }
    }

    private boolean isElementPresent(By by)
    {
        try
        {
            driver.findElement(by);
            return true;
        }
        catch (NoSuchElementException e)
        {
            return false;
        }
    }

    private String closeAlertAndGetItsText()
    {
        try
        {
            Alert alert = driver.switchTo().alert();
            if (acceptNextAlert)
            {
                alert.accept();
            }
            else
            {
                alert.dismiss();
            }
            return alert.getText();
        }
        finally
        {
            acceptNextAlert = true;
        }
    }

    static public void main(String[] args)
    {
        Alibaba ali = new Alibaba();
        try
        {
            ali.setUp();
            ali.testAlibaba();
        }
        catch (Exception e)
        {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

    }
    
    public ArrayList<String> getKeywords(String fileName)
    {
        ArrayList<String> keywords = new ArrayList<String>();
//        FileReader reader = new FileReader(new BufferedReader(filename));
        String keyword;
        try
        {
            BufferedReader reader = new BufferedReader(new FileReader(new File(fileName)));
            while((keyword =reader.readLine())!= null)
            {
                keywords.add(keyword);
            }
            
        }
        catch (FileNotFoundException e)
        {
            e.printStackTrace();
        }
        catch (IOException e)
        {
            e.printStackTrace();
        }
        
        return keywords;
    }
}
