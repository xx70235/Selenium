package main;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
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

import models.ProxyModel;

import org.junit.*;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.support.ui.Select;

public class AlexaHacker
{
    private WebDriver driver;
    private String baseUrl;
    private boolean acceptNextAlert = true;
    private StringBuffer verificationErrors = new StringBuffer();
    String sqldriver = "com.mysql.jdbc.Driver";
    String url = "jdbc:mysql://127.0.0.1:3306/PostData";
    String targetUrl = "http://www.slors.cn/";
    String user = "root";
    String password = "";
    Statement statement = null;
    Connection conn;
    ResultSet rs;
    FirefoxProfile profile;
    ArrayList<ProxyModel> proxyList;
    ArrayList<String> alList;
    ArrayList<String> agentList;

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
    
    public void initialize()
    {
        File file = new File("alexa");
        profile = new FirefoxProfile(file);

        generateProxyList("proxy.txt");
        generateAcceptLangList("acceptLanguage.txt");
        generateAgent("useragent.txt");
    }

    @Before
    public void setUp() throws Exception
    {
       

//        baseUrl = "http://www.slors.cn/";
//        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);

        if (proxyList != null)
        {
            int index = 0;
            System.out.println("proxy count= "+proxyList.size());
            for (ProxyModel proxy : proxyList)
            {
                setProxy(proxy);
                setAcceptLang();
                setAgent();
                
                try {
                driver = new FirefoxDriver(profile);

                baseUrl = targetUrl;
                driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
                testFen();
               
                }
                catch(Exception e)
                {
                    e.printStackTrace();
                }
                System.out.println(++index +":"+proxyList.size());
                
            }
        }

       
    }

    public void generateProxyList(String filePath)
    {
        proxyList = new ArrayList<ProxyModel>();

        BufferedReader br = null;
        try
        {
            br = new BufferedReader(new FileReader(new File(filePath)));
            String tmp = "";
            while ((tmp = br.readLine()) != null)
            {
                ProxyModel proxyModel = new ProxyModel();
                proxyModel.generateProxyModel(tmp.trim());
                proxyList.add(proxyModel);
            }
        }
        catch (FileNotFoundException e)
        {
        }
        catch (IOException e)
        {
        }
        finally
        {
            try
            {
                br.close();
            }
            catch (IOException e)
            {
            }
        }
    }
    
    public void generateAcceptLangList(String filepath) {
        alList = new ArrayList<String>();
        BufferedReader bReader;
        try {
            bReader = new BufferedReader(new FileReader(new File(
                    "AcceptLanguage.txt")));
            String tmp = "";
            while ((tmp = bReader.readLine()) != null) {
                alList.add(tmp);
            }

          
            bReader.close();
        } catch (FileNotFoundException e) {
        } catch (IOException e) {
        }

    }
    
    public void generateAgent(String filepath) {
        agentList = new ArrayList<String>();
        BufferedReader bReader;
        try {
            bReader = new BufferedReader(new FileReader(new File(
                    "useragent.txt")));
            String tmp = "";
            while ((tmp = bReader.readLine()) != null) {
                agentList.add(tmp);
            }

          
            bReader.close();
        } catch (FileNotFoundException e) {
        } catch (IOException e) {
        }

    }
    
    public void setAgent()
    {
        Random random = new Random();
        int i = random.nextInt(agentList.size());
        String agent = agentList.get(i);
        if(profile!=null)
        {
            profile.setPreference("User-Agent", agent);
        }
    }
    
    
    public void setAcceptLang()
    {
        Random random = new Random();
        int i = random.nextInt(alList.size());
        String acceptLang = alList.get(i);
        if(profile!=null)
        {
            profile.setPreference("Accept-Language", acceptLang);
        }
    }


    /**
     * 设置firefox的proxy，暂时只支持http协议
     * 
     * @param proxy
     */
    public void setProxy(ProxyModel proxy)
    {
        // Proxy proxy = new Proxy();
        // profile.setProxyPreferences(proxy);
        profile.setPreference("network.proxy.type", 1);
        // http协议代理配置
        profile.setPreference("network.proxy.http", proxy.getProxyIp());
        profile.setPreference("network.proxy.http_port", proxy.getProxyPort());
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
    public void testFen() 
    {
        //牛逼！！！
        try {
            Thread t = new Thread(new Runnable()
            {
              public void run()
              {
                driver.get(Thread.currentThread().getName());
                driver.manage().deleteAllCookies();
                driver.close();
              }
            }, targetUrl);
            t.start();
            try
            {
              t.join(120000);
            }
            catch (InterruptedException e)
            { 
            }
            if (t.isAlive())
            {
              System.out.println("Timeout on loading page " + targetUrl);
              t.interrupt();
            }
           
            
        }catch(TimeoutException e)
        {
            e.printStackTrace();
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
        AlexaHacker ipr = new AlexaHacker();
        try
        {
            ipr.initialize();
            ipr.setUp();
          
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }

    }
}
