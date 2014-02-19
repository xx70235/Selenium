import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.TimeUnit;

import org.eclipse.swt.SWT;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import models.ProxyModel;

import org.junit.*;

import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.support.ui.Select;
import org.eclipse.swt.widgets.Label;

public class SBrowser
{
    private WebDriver driver;
    private String baseUrl;
    protected Shell shell;
    FirefoxProfile profile;
    ArrayList<ProxyModel> proxyList;
    ArrayList<String> alList;
    ArrayList<String> agentList;
    Label lblAgent;
    Label lblClearCookies;

    public void initialize()
    {
        File file = new File("profiles");
        profile = new FirefoxProfile(file);
        // profile = new FirefoxProfile();
        setProxy();
        generateAcceptLangList("acceptLanguage.txt");
        generateAgent("useragent.txt");
        setAcceptLang();
        setAgent();
    }

    @Before
    public void setUp() throws Exception
    {

        driver = new FirefoxDriver(profile);
        baseUrl = "http://www.ipaofu.com/";
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
        // driver.get("http://www.google.com");
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

    public void generateAcceptLangList(String filepath)
    {
        alList = new ArrayList<String>();
        BufferedReader bReader;
        try
        {
            bReader = new BufferedReader(
                                         new FileReader(
                                                        new File(
                                                                 "AcceptLanguage.txt")));
            String tmp = "";
            while ((tmp = bReader.readLine()) != null)
            {
                alList.add(tmp);
            }

            bReader.close();
        }
        catch (FileNotFoundException e)
        {
        }
        catch (IOException e)
        {
        }

    }

    public void generateAgent(String filepath)
    {
        agentList = new ArrayList<String>();
        BufferedReader bReader;
        try
        {
            bReader = new BufferedReader(
                                         new FileReader(
                                                        new File(
                                                                 "useragent.txt")));
            String tmp = "";
            while ((tmp = bReader.readLine()) != null)
            {
                agentList.add(tmp);
            }

            bReader.close();
        }
        catch (FileNotFoundException e)
        {
        }
        catch (IOException e)
        {
        }

    }

    public void setAgent()
    {
        Random random = new Random();
        int i = random.nextInt(agentList.size());
        String agent = agentList.get(i);
        if (profile != null)
        {
            profile.setPreference("general.useragent.override", agent);

            if (lblAgent != null)
            {
                lblAgent.setText(agent);
            }

        }
    }

    public void setAcceptLang()
    {
        Random random = new Random();
        int i = random.nextInt(alList.size());
        String acceptLang = alList.get(i);
        if (profile != null)
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
        profile.setPreference("network.proxy.type", 1);
        // http协议代理配置
        profile.setPreference("network.proxy.http", proxy.getProxyIp());
        profile.setPreference("network.proxy.http_port", proxy.getProxyPort());
    }

    public void setProxy()
    {
        profile.setPreference("network.proxy.type", 1);
        profile.setPreference("network.proxy.socks", "127.0.0.1");
        profile.setPreference("network.proxy.socks_port", 9951);
    }

    /**
     * Launch the application.
     * 
     * @param args
     */
    public static void main(String[] args)
    {
        try
        {
            SBrowser window = new SBrowser();

            window.open();

        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }

    /**
     * Open the window.
     */
    public void open()
    {
        Display display = Display.getDefault();
        
        
        createContents();
        shell.open();
        shell.layout();
        initialize();
        try
        {
            setUp();
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        while (!shell.isDisposed())
        {
            if (!display.readAndDispatch())
            {
                display.sleep();
            }
        }
    }

    /**
     * Create contents of the window.
     * 
     * @wbp.parser.entryPoint
     */
    protected void createContents()
    {
        shell = new Shell();
        shell.setSize(450, 300);
        shell.setText("SWT Application");

        Button btnCCookies = new Button(shell, SWT.NONE);
        btnCCookies.addSelectionListener(new SelectionAdapter() {
            @Override
            public void widgetSelected(SelectionEvent e)
            {
                driver.manage().deleteAllCookies();
                lblClearCookies.setText("Cookies已清理");
            }
        });
        btnCCookies.setBounds(10, 35, 96, 38);
        btnCCookies.setText("\u6E05Cookies");

        Button btCheckIp = new Button(shell, SWT.NONE);
        btCheckIp.addSelectionListener(new SelectionAdapter() {
            @Override
            public void widgetSelected(SelectionEvent e)
            {
                // setProxy();
                driver.get("http://www.check2ip.com");
            }
        });
        btCheckIp.setText("\u67E5\u770B\u4EE3\u7406");
        btCheckIp.setBounds(10, 104, 96, 38);

        lblAgent = new Label(shell, SWT.NONE);
        lblAgent.setBounds(138, 115, 286, 17);
        lblAgent.setText("Agent\u60C5\u51B5");

        lblClearCookies = new Label(shell, SWT.NONE);
        lblClearCookies.setBounds(138, 46, 286, 17);
        lblClearCookies.setText("Cookies\u6E05\u6CA1\u6E05\uFF1F");

    }
}
