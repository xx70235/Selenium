package main;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;

import models.TaobaoProducts;

import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class Ipaofu_poster
{
    private WebDriver driver;
    private String baseUrl;
    private boolean acceptNextAlert = true;
    private StringBuffer verificationErrors = new StringBuffer();
    String sqldriver = "com.mysql.jdbc.Driver";
    String url = "jdbc:mysql://127.0.0.1:3306/PostData";
    String user = "root";
    String password = "";
    Statement statement = null;
    Connection conn;
    ResultSet rs;

    private HashMap<String, ArrayList<String>> reviewMap;

    public void getDBconnect()
    {
        try
        {
            Class.forName(sqldriver);
            conn = DriverManager.getConnection(url, user, password);
            if (!conn.isClosed())
                System.out.println("Succeeded connecting to the Database!");
            statement = conn.createStatement();
        }
        catch (ClassNotFoundException e)
        {
            System.out.println("Sorry,can`t find the Driver!");
            e.printStackTrace();
        }
        catch (SQLException e)
        {
            e.printStackTrace();
        }
    }

    public List<String> getUsernameFromDB(int count)
    {
        ArrayList<String> usernames = new ArrayList<String>();
        String sqlstr = " SELECT  * from username  where status = 2 limit 0,"
                + count;

        if (statement != null)
            try
            {
                rs = statement.executeQuery(sqlstr);
                String name;
                while (rs.next())
                {
                    name = rs.getString("name");
                    System.out.println(name);
                    usernames.add(name);
                }
            }
            catch (SQLException e)
            {
                e.printStackTrace();
            }

        return usernames;
    }

    public void generateReviewList()
    {
        reviewMap = new HashMap<String, ArrayList<String>>();
        String sqlstr = " SELECT keyword, reviews from ok ";

        if (statement != null)
            try
            {
                rs = statement.executeQuery(sqlstr);
                String keyword;
                String review;
                while (rs.next())
                {
                    keyword = rs.getString("keyword");
                    review = rs.getString("reviews");
                    if (review != null && review.length() != 0)
                    {
                        if (reviewMap.get(keyword) == null)
                        {
                            reviewMap.put(keyword, new ArrayList<String>());
                        }
                        else
                        {
                            reviewMap.get(keyword).add(review);
                        }
                    }
                }
            }
            catch (SQLException e)
            {
                e.printStackTrace();
            }

    }

    public List<TaobaoProducts> getProductsFromDB(int count)
    {
        List<TaobaoProducts> productList = new ArrayList<TaobaoProducts>();
        TaobaoProducts tp;
        String sqlstr = " SELECT  * from ok where flag = 0 limit 0," + count;

        if (statement != null)
            try
            {
                rs = statement.executeQuery(sqlstr);
                while (rs.next())
                {
                    tp = new TaobaoProducts();
                    tp.setNumid(rs.getString("numid"));
                    tp.setKeyword(rs.getString("keyword"));
                    if (rs.getString("reviews") != null
                            && rs.getString("reviews").length() != 0)
                    {
                        tp.setReviews(rs.getString("reviews"));
                    }
                    else
                    {
                        Random r = new Random();
                        ArrayList<String> rl = new ArrayList<String>();
                        rl = reviewMap.get(tp.getKeyword());
                        String tmp = rl.get(r.nextInt(rl.size()));
                        tp.setReviews(tmp);
                    }
                    productList.add(tp);
                }
            }
            catch (SQLException e)
            {
                e.printStackTrace();
            }

        return productList;
    }

    public void SetStatusT0DB(List<TaobaoProducts> productsList)
    {
        for (TaobaoProducts tmp : productsList)
        {
            String sqlstr = " Update ok set flag = 1 where numid = '"
                    + tmp.getNumid() + "' ";

            if (statement != null)
                try
                {
                    statement.executeUpdate(sqlstr);
                }
                catch (SQLException e)
                {
                    e.printStackTrace();
                }

        }
    }

    @Before
    public void setUp() throws Exception
    {
        driver = new FirefoxDriver();
        baseUrl = "http://www.ipaofu.com/";
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
    }

    /**
     * 从用户名表中取出100个用户名（status = 2）的，然后每个用户名发布50个
     * 
     * @throws Exception
     */
    @Test
    public void testPostgoods() throws Exception
    {
        List<String> usernameList = getUsernameFromDB(100);
        generateReviewList();
        List<TaobaoProducts> productList = null;
        int piCount = 1;
        for (String username : usernameList)
        {
            productList = getProductsFromDB(8);
            for (TaobaoProducts product : productList)
            {
                try
                {
                    driver.get(baseUrl + "/user/login");
                    driver.findElement(By.name("email_name")).clear();
                    driver.findElement(By.name("email_name")).sendKeys(username);
                    driver.findElement(By.name("pass")).clear();
                    driver.findElement(By.name("pass")).sendKeys("111111");
                    driver.findElement(By.id("login_submit")).click();
                    driver.findElement(By.linkText("商品")).click();
                    driver.findElement(
                            By.xpath("//div[@id='lb_goods']/div/div/input")).clear();
                    driver.findElement(
                            By.xpath("//div[@id='lb_goods']/div/div/input")).sendKeys(
                            "http://item.taobao.com/item.htm?id="
                                    + product.getNumid());
                    driver.findElement(By.xpath("//input[@value='确 定']")).click();
                    driver.findElement(
                            By.xpath("//form[@id='u_zone_form']/div/div/div[2]/div/ul/li/span")).click();
                    // By.cssSelector("span.fw_count");
                    WebDriverWait wait = new WebDriverWait(driver, 20);
                    WebElement element = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//form[@id='u_zone_form']/div/div/div[2]/div/ul/li/span")));
                    element.click();
                    driver.findElement(By.name("content")).clear();
                    String tmpRe = "#" + product.getKeyword() + "#"
                            + product.getReviews();
                    if (tmpRe.length() > 138)
                    {
                        tmpRe = "" + tmpRe.subSequence(0, 138);
                    }
                    driver.findElement(By.name("content")).sendKeys(tmpRe);
                    driver.findElement(By.id("uPubBtn")).click();
                    wait.until(ExpectedConditions.textToBePresentInElement(
                            By.cssSelector("span.fw_count"), "140"));
                    
                }
                catch (UnhandledAlertException ex)
                {
                    ex.printStackTrace();
         
                }
                catch (WebDriverException ex1)
                {
                    ex1.printStackTrace();
                    try {
                        Alert alert = driver.switchTo().alert();
                        if(alert!=null)
                            alert.dismiss();
                    }
                    catch(NoAlertPresentException e)
                    {
                        e.printStackTrace();
                    }
                    
                }
                
                
                driver.manage().deleteAllCookies();
                
              
                //
            }
            SetStatusT0DB(productList);

            System.out.println("搞定第" + (piCount++) + "批！！！！！！！！！！");
        }
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
        Ipaofu_poster ipr = new Ipaofu_poster();
        try
        {
            ipr.setUp();
            ipr.getDBconnect();
            ipr.testPostgoods();
        }
        catch (Exception e)
        {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

    }
}
