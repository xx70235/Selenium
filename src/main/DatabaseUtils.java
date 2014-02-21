package main;
 

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException; 
import java.io.InputStream; 
import java.sql.Connection; 
import java.sql.DriverManager; 
import java.sql.ResultSet; 
import java.sql.SQLException; 
import java.sql.Statement; 
import java.util.ArrayList; 
import java.util.HashMap; 
import java.util.List; 
import java.util.Map; 
import java.util.Properties; 
   
/*** 
 * Date:2013-01-21  
 * 注意：属性文件（文件名：dbconfig.propertise） 
 * 属性文件内容（依情况修改）： 
 *      driver = com.mysql.jdbc.Driver 
 *      url = jdbc:mysql://localhost:3306/AmazonProducts?useUnicode=true&characterEncoding=gbk 
 *      username = root 
 *      password =lyl123  
 * */
   
public final class DatabaseUtils { 
    private static String driver; 
    private static String url; 
    private static String username; 
    private static String password; 
   
    public static final void getPropertise() { 
        Properties pro = new Properties(); 
        File f = new File("conf/dbconfig.properties");
        InputStream in=null;
        try
        {
            in = new FileInputStream(f);
        }
        catch (FileNotFoundException e1)
        {
            // TODO Auto-generated catch block
        }  

        try { 
            if(in == null)
                return;
            pro.load(in); 
            driver = pro.getProperty("driver"); 
            url = pro.getProperty("url"); 
            username = pro.getProperty("username"); 
            password = pro.getProperty("password"); 
        } catch (IOException e) { 
            e.printStackTrace(); 
        } 
//        driver = "com.mysql.jdbc.Driver";
//       url = "jdbc:mysql://127.0.0.1:3306/PostData";
//        username = "root";
//         password = "";
    } 
   
    // 创建连接 
    public static final Connection openConnection() { 
        Connection con = null; 
        try { 
            Class.forName(driver); 
            con = DriverManager.getConnection(url, username, password); 
        } catch (ClassNotFoundException e) { 
            e.printStackTrace(); 
        } catch (SQLException e) { 
            e.printStackTrace(); 
        } 
        return con; 
    } 
   
    // 关闭数据库 
    public static final void closeDatabase(Connection con, Statement stmt, 
            ResultSet rs) { 
        try { 
            if (rs != null) { 
                rs.close(); 
            } 
            if (stmt != null) { 
                stmt.close(); 
            } 
            if (con != null) { 
                con.close(); 
            } 
        } catch (SQLException e) { 
            e.printStackTrace(); 
        } 
    } 
   
    // 数据库查询 
    public static final List sqlQuery(String sqlquery) { 
        List list = new ArrayList(); 
        getPropertise(); 
        Connection con = null; 
        Statement stmt = null; 
        ResultSet rs = null; 
        try { 
            con = openConnection(); 
            stmt = con.createStatement(); 
            rs = stmt.executeQuery(sqlquery); 
   
            while (rs.next()) { 
                HashMap map = new HashMap(); 
                for (int i = 0; i < rs.getMetaData().getColumnCount(); i++) { 
                    map.put(i, rs.getString(i + 1)); 
                } 
                list.add(map); 
            } 
        } catch (SQLException e) { 
            e.printStackTrace(); 
        } finally { 
            closeDatabase(con, stmt, rs); 
        } 
        return list; 
    } 
   
    // 数据库增删改 
    public static final void sqlUpdate(String sqlupdate) { 
        Connection con = null; 
        Statement stmt = null; 
        try { 
            getPropertise(); 
            con = openConnection(); 
            // 设置事务手动提交 
            con.setAutoCommit(false); 
            stmt = con.createStatement(); 
            stmt.execute(sqlupdate); 
            con.commit(); 
        } catch (SQLException e) { 
            try { 
                //若出错则回滚事务
                con.rollback(); 
            } catch (SQLException e1) { 
                e1.printStackTrace(); 
            } 
            e.printStackTrace(); 
        } finally { 
            closeDatabase(con, stmt, null); 
        } 
    } 
   
    // 数据库操作(增、删、查、改) 
    public static final List sqlDatabase(String sql) { 
        if (sql.toLowerCase().indexOf("select") != -1) {// 查询操作 
            return sqlQuery(sql); 
        } else {// 增、删、改 
            sqlUpdate(sql); 
            return null; 
        } 
    } 
   
    public static void main(String[] agrs) { 
        // 查询语句 
        String sqlquery = "select a.STUDENTID,b.CLASSNAME,a.STUDENTNAME,a.SEX,a.AGE "
                + "from x_student a, x_class b "
                + "where a.CLASSID = b.CLASSID"; 
        List datalist = DatabaseUtils.sqlDatabase(sqlquery); 
        Map map; 
        for (Object obj : datalist) { 
            map = (HashMap) obj; 
            for (int i = 0; i < map.size(); i++) { 
                System.out.print(map.get(i) + "\t"); 
            } 
            System.out.println(); 
        } 
    } 
}