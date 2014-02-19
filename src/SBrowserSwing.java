import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.JButton;
import java.awt.BorderLayout;
import java.awt.Font;

import javax.swing.JTextPane;
import javax.swing.JTextField;

import models.CardModel;
import models.CardStatus;
import models.ProxyModel;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;

import action.FinalPageWP;
import action.FirstPageWP;

import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import javax.swing.JTextArea;
import javax.swing.border.TitledBorder;
import javax.swing.JRadioButton;
import javax.swing.UIManager;
import java.awt.Color;

public class SBrowserSwing
{

    private JFrame frmSbrowser;
    private WebDriver driver;
    private String baseUrl;
    FirefoxProfile profile;
    ArrayList<ProxyModel> proxyList;
    ArrayList<String> alList;
    ArrayList<String> agentList;
//    CountDownLatch openPageCountDown;
    CountDownLatch firstPageCountdown;//��һҳִ�п��Ʒ�
    CountDownLatch executeCountdown;//���ִ�п��Ʒ�
    boolean executeFinish;
    JTextArea tfCardInfo;

    public void initial()
    {
        File file = new File("profiles");
        profile = new FirefoxProfile(file);
        setProxy();
        generateAcceptLangList("acceptLanguage.txt");
        generateAgent("useragent.txt");
        setAcceptLang();
        setAgent();
    }

    public void setUp() throws Exception
    {
        // ���������profile������UA������
        initial();
        // �������
        // if(driver==null)
        driver = new FirefoxDriver(profile);
        // ����baseurl
        baseUrl = "http://www.ipaofu.com/";
        // ���õȴ�ʱ�䣨���˾����Ǹ�ɶ���ˣ������ô�����
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
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

            // if (lblAgent != null)
            // {
            // lblAgent.setText(agent);
            // }

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

    public void setProxy()
    {
        profile.setPreference("network.proxy.type", 1);
        profile.setPreference("network.proxy.socks", "127.0.0.1");
        profile.setPreference("network.proxy.socks_port", 9951);
    }

    /**
     * Launch the application.
     */
    public static void main(String[] args)
    {
        EventQueue.invokeLater(new Runnable() {
            public void run()
            {
                try
                {
                    SBrowserSwing window = new SBrowserSwing();
                    window.frmSbrowser.setVisible(true);
                }
                catch (Exception e)
                {
                    e.printStackTrace();
                }
            }
        });
    }

    /**
     * Create the application.
     */
    public SBrowserSwing()
    {
        initialize();
    }

    /**
     * Initialize the contents of the frame.
     */
    private void initialize()
    {
        frmSbrowser = new JFrame();
        frmSbrowser.setTitle("SBrowser-Swing");
        frmSbrowser.setBounds(100, 100, 518, 404);
        frmSbrowser.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frmSbrowser.getContentPane().setLayout(null);

        JButton button = new JButton("\u542F\u52A8\u6D4F\u89C8\u5668");
        button.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent arg0)
            {

                try
                {
                    // ����firefox�����
                    setUp();
                }
                catch (Exception e)
                {
                    e.printStackTrace();
                }
            }
        });
        button.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        button.setBounds(21, 12, 115, 37);
        frmSbrowser.getContentPane().add(button);

        JButton btncookies = new JButton("\u6E05\u9664Cookies");
        // ���Cookies
        btncookies.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e)
            {

                driver.manage().deleteAllCookies();
            }
        });
        btncookies.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        btncookies.setBounds(21, 61, 115, 37);
        frmSbrowser.getContentPane().add(btncookies);
        // �鿴�������ip96ʹ��
        JButton button_1 = new JButton("\u67E5\u770B\u4EE3\u7406");
        button_1.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e)
            {

                driver.get("http://www.check2ip.com");
            }
        });
        button_1.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        button_1.setBounds(21, 110, 115, 37);
        frmSbrowser.getContentPane().add(button_1);

        JButton btContinue = new JButton("\u7EE7\u7EED");
        btContinue.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent arg0) {
                if(executeCountdown!=null)
                executeCountdown.countDown();
                
                firstPageCountdown = new CountDownLatch(1);
                executeCountdown = new CountDownLatch(1);
            }
        });
        btContinue.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        btContinue.setBounds(21, 259, 115, 37);
        frmSbrowser.getContentPane().add(btContinue);

        JButton btnExcuteAd = new JButton("\u6253\u5F00WE\u5E7F\u544A");
        btnExcuteAd.addActionListener(new ExuteWEAdAction());

        btnExcuteAd.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        btnExcuteAd.setBounds(21, 159, 115, 37);
        frmSbrowser.getContentPane().add(btnExcuteAd);

        JButton btExcuteSecondPage = new JButton(
                                                 "\u6267\u884C\u7B2C\u4E8C\u9875");
        btExcuteSecondPage.addActionListener(new ExcuteFinalPageAction());
        btExcuteSecondPage.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        btExcuteSecondPage.setBounds(21, 209, 115, 37);
        frmSbrowser.getContentPane().add(btExcuteSecondPage);
        
        tfCardInfo = new JTextArea();
        tfCardInfo.setBorder(new TitledBorder(UIManager.getBorder("TitledBorder.border"), "Card Info", TitledBorder.LEADING, TitledBorder.TOP, null, new Color(0, 0, 0)));
        tfCardInfo.setFont(new Font("΢���ź�", Font.PLAIN, 12));
        tfCardInfo.setBounds(162, 19, 309, 282);
        frmSbrowser.getContentPane().add(tfCardInfo);
        
        JRadioButton rbUsed = new JRadioButton("\u5DF2\u7528");
        rbUsed.setFont(new Font("΢���ź�", Font.PLAIN, 15));
        rbUsed.setBounds(159, 314, 59, 27);
        frmSbrowser.getContentPane().add(rbUsed);
        
        JRadioButton rbDead = new JRadioButton("\u5DF2\u6B7B");
        rbDead.setFont(new Font("΢���ź�", Font.PLAIN, 15));
        rbDead.setBounds(224, 314, 59, 27);
        frmSbrowser.getContentPane().add(rbDead);
        
        JRadioButton rbAddrError = new JRadioButton("\u5730\u5740\u9519\u8BEF");
        rbAddrError.setFont(new Font("΢���ź�", Font.PLAIN, 15));
        rbAddrError.setBounds(286, 314, 98, 27);
        frmSbrowser.getContentPane().add(rbAddrError);
        
        JRadioButton rbInsuffiBalance = new JRadioButton("\u4F59\u989D\u4E0D\u8DB3");
        rbInsuffiBalance.setFont(new Font("΢���ź�", Font.PLAIN, 15));
        rbInsuffiBalance.setBounds(382, 314, 89, 27);
        frmSbrowser.getContentPane().add(rbInsuffiBalance);
    }

    class ExuteWEAdAction implements ActionListener
    {

        @Override
        public void actionPerformed(ActionEvent e)
        {
            firstPageCountdown = new CountDownLatch(1);
            executeCountdown = new CountDownLatch(1);
            
            ExecuteAd executeAd = new ExecuteAd();
            executeAd.start();
            
        }
       
    }
    class ExecuteAd extends Thread
    {
        @Override
        public void run()
        {
            List<CardModel> cardList = new ArrayList<CardModel>();
            readCardTxt("card.txt",cardList);
            for (CardModel card : cardList)
            {
                if (card.getcStatus().equals(CardStatus.Normal)
                        || card.getcStatus().equals(CardStatus.Unknown))
                {
                    showCardInfo(card);
                    FirstPageWP firstPage = new FirstPageWP(driver, card);
                    FinalPageWP finalPage = new FinalPageWP(driver, card);
                    try
                    {
                        
                        firstPage.emuAction();
                        //�ȴ���һҳ����֤�����sign up��ť����
                        firstPageCountdown.await();
                        System.out.println("Second Page");
                        finalPage.emuAction();
                        executeFinish = true;
                        //�ȴ��ڶ�ҳ��ť���¼�������
                        executeCountdown.await();
                        
                    }
                    catch (Exception e)
                    {
                        e.printStackTrace();
                    }
                    
                    
                }
                    
                }
            }
        
        
        private void readCardTxt(String filePath,List<CardModel> cardList)
        {
            BufferedReader br = null;
            try
            {
                br = new BufferedReader(new FileReader(new File(filePath)));
                String tmp = "";
                CardModel card;
                while ((tmp = br.readLine()) != null)
                {
                    card = new CardModel();
                    card.generateModel(tmp);
                    cardList.add(card);
                }
            }
            catch (FileNotFoundException e)
            {
                System.out.println("No Card File!");
                e.printStackTrace();
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
        
        public void showCardInfo(CardModel card)
        {
            tfCardInfo.setText(card.toString());
        }
    }


//    class FirstPageThread extends Thread
//    {
//        CardModel card;
//        public FirstPageThread(CardModel card)
//        {
//            this.card = card;
//        }
//
//        @Override
//        public void run()
//        {
//            FirstPageWP firstPage = new FirstPageWP(driver, card);
//            try
//            {
//                firstPage.emuAction();
//                
//                firstPageCountdown.await();
//                System.out.println("Second Page");
//                //TODO������һ���ȴ�ʱ�ӣ�countdown���ȴ���һ����ť����ʱ������
//                
//            }
//            catch (Exception e)
//            {
//                e.printStackTrace();
//            }
//            
//            //TODO:second Page,���û�����ĵȴ�ʱ��
//        }
//    }
    
    
    class ExcuteFinalPageAction implements ActionListener
    {

        @Override
        public void actionPerformed(ActionEvent e)
        {
            if(firstPageCountdown!=null)
                firstPageCountdown.countDown();
           
        }
        
    }
}
