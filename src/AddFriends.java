import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
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
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.support.ui.Select;

public class AddFriends
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
    FirefoxProfile profile;

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

    @Before
    public void setUp() throws Exception
    {
        File file = new File("profiles");
        profile = new FirefoxProfile(file);
        driver = new FirefoxDriver(profile);
      
        baseUrl = "http://www.ipaofu.com/";
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
    }

    public List<String> getUsernameFromDB(int count)
    {
        ArrayList<String> usernames = new ArrayList<String>();
        String sqlstr = " SELECT  * from username  where status = 1 limit 0,"
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

    @Test
    public void testFen() throws Exception
    {
        List<String> usernameList = getUsernameFromDB(1000);
        Random r = new Random();
        int userindex = 0;
        for (String username : usernameList)
        {
            driver.get(baseUrl + "/user/login");
            driver.findElement(By.name("email_name")).clear();
            driver.findElement(By.name("email_name")).sendKeys(username);
            driver.findElement(By.name("pass")).clear();
            driver.findElement(By.name("pass")).sendKeys("111111");
            driver.findElement(By.id("login_submit")).click();
            
            // 每个用户添加20个好友（从编号小于1320的好友中任选20个）
            for (int fc = 0; fc < 20; fc++)
            {
                driver.get(baseUrl + "/u/" + r.nextInt(1320) + "/talk");

                boolean noError = true;
                do
                {
                    try
                    {
                        List<WebElement> eles = driver.findElements(By.linkText("加关注"));
//                        driver.findElement(By.linkText("加关注")).click();
                        System.out.println(eles.size());
                        if (eles.size() > 0)
                        {
                            for (int i = 0; i < 1; i++)
                            {
                                eles.get(0).click();
                                Thread.sleep(1000);
                            }
                        }
                        noError = true;
                    }
                    catch (StaleElementReferenceException ex)
                    {
                        noError = false;
                    }
                }
                while (!noError);

                List<WebElement> eles1 = driver.findElements(By.cssSelector("a.add_fav.fav"));
                System.out.println(eles1.size());
                if (eles1.size() > 0)
                {
                    for (int i = 0; i < r.nextInt(eles1.size()); i++)
                    {
                        eles1.get(r.nextInt(eles1.size())).click();
                    }
                }
                System.out.println("完成第" + (++userindex) + "用户");
                
            }
            driver.manage().deleteAllCookies();
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
        AddFriends ipr = new AddFriends();
        try
        {
            ipr.setUp();
            ipr.getDBconnect();
            ipr.testFen();
        }
        catch (Exception e)
        {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

    }
}
