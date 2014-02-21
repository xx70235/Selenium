package main;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class Ipofu_register
{
    private WebDriver driver;
    private String baseUrl;
    private boolean acceptNextAlert = true;
    private StringBuffer verificationErrors = new StringBuffer();

    String sqldriver = "com.mysql.jdbc.Driver";
    String url = "jdbc:mysql://127.0.0.1:3306/ipaofu_username";
    String user = "root";
    String password = "";
    Statement statement = null;
    Connection conn;
    ResultSet rs;

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
        String sqlstr = " SELECT  * from username  where status = 0 limit 0,"+count;

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
    
    public void SetStatusT0DB(List<String> usernames)
    {
        for(String str:usernames)
        {
        String sqlstr = " Update username  set status = 1 where name = '"+str+"' ";

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

    public void importDataToDB()
    {
        ArrayList<String> keywords = new ArrayList<String>();
        // FileReader reader = new FileReader(new BufferedReader(filename));
        String tmp;
        try
        {
            BufferedReader reader = new BufferedReader(
                                                       new FileReader(
                                                                      new File(
                                                                               "username.txt")));
            while ((tmp = reader.readLine()) != null)
            {
                String[] strs = tmp.split("#");

                for (String s : strs)
                {
                    System.out.println(s);
                    keywords.add(s);
                }
            }
            int i = 1;
            for (String str : keywords)
            {
                String sqlstr = " INSERT INTO username VALUES (" + i++ + ",\""
                        + str.trim() + "\"," + 0 + ")";
                if (statement != null)
                    statement.execute(sqlstr);
            }
            statement.close();
            conn.close();

        }
        catch (FileNotFoundException e)
        {
            e.printStackTrace();
        }
        catch (IOException e)
        {
            e.printStackTrace();
        }
        catch (SQLException e)
        {
            e.printStackTrace();
        }

    }

    @Before
    public void setUp() throws Exception
    {
        driver = new FirefoxDriver();
        baseUrl = "http://www.ipaofu.com/";
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
    }

    @Test
    public void testIpofuRegister() throws Exception
    {
        WebDriverWait wait = new WebDriverWait(driver, 20);
        driver.get(baseUrl + "/admin/index.php?a=login&m=Public");
        driver.findElement(By.id("admin_name")).clear();
        driver.findElement(By.id("admin_name")).sendKeys("xunion");
        driver.findElement(By.id("admin_pwd")).clear();
        driver.findElement(By.id("admin_pwd")).sendKeys("fanwe");
        driver.findElement(By.id("verify")).clear();

        boolean signal = false;
        WebElement element = null;
        // while(!signal)
        // {
        try
        {
            while (element == null)
            {
                element = wait.until(ExpectedConditions.elementToBeClickable(By.linkText("")));
                // signal= true;
            }
        }
        catch (NoSuchElementException e)
        {
            System.out.println("finding");
        }
        catch (TimeoutException e)
        {
            System.out.println("time out");
        }
        List<String> usernames;
        while ((usernames = getUsernameFromDB(30)).size() != 0)
        {
            for (String name : usernames)
            {
                driver.get(baseUrl + "/admin/index.php?a=add&m=User");
                driver.findElement(By.id("user_name")).clear();
                driver.findElement(By.id("user_name")).sendKeys(name);
                driver.findElement(By.id("email")).clear();
                driver.findElement(By.id("email")).sendKeys(
                        randomString(7) + "@gmail.com");
                driver.findElement(By.id("password")).clear();
                driver.findElement(By.id("password")).sendKeys("111111");
                driver.findElement(By.id("confirm_password")).clear();
                driver.findElement(By.id("confirm_password")).sendKeys("111111");
                driver.findElement(By.cssSelector("input.submit_btn")).click();
//                Thread.sleep(1500);
            }
            SetStatusT0DB(usernames);
        }
        statement.close();
        conn.close();
    }

    public String randomString(int length)
    {
        Random randGen = null;
        char[] numbersAndLetters = null;

        if (length < 1)
        {
            return null;
        }
        if (randGen == null)
        {
            randGen = new Random();
            numbersAndLetters = ("0123456789abcdefghijklmnopqrstuvwxyz"
                    + "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ").toCharArray();
            // numbersAndLetters =
            // ("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ").toCharArray();
        }
        char[] randBuffer = new char[length];
        for (int i = 0; i < randBuffer.length; i++)
        {
            randBuffer[i] = numbersAndLetters[randGen.nextInt(71)];
            // randBuffer[i] = numbersAndLetters[randGen.nextInt(35)];
        }
        return new String(randBuffer);
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
        Ipofu_register ipr = new Ipofu_register();
        try
        {
            ipr.setUp();
            ipr.getDBconnect();
//            ipr.getUsernameFromDB();
            // ipr.importDataToDB();
//            System.out.println("ok");
             ipr.testIpofuRegister();
             System.out.println("ok");
        }
        catch (Exception e)
        {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

    }
}
