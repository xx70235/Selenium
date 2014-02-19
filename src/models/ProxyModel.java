package models;



public class ProxyModel {

    private String porxyIp;
    private int proxyPort;
    private String proxyType;
    private ProxyStatus proxyStatus;
    
    public ProxyModel()
    {
    
    }
    
    public ProxyModel generateProxyModel(String proxyStr)
    {
    try{
    String[] tmps= proxyStr.split(":");
    this.porxyIp = tmps[0];
    this.proxyPort =Integer.parseInt(tmps[1]);
    this.proxyType = " ";
    this.proxyStatus = ProxyStatus.Unknown;
    }catch(NumberFormatException e)
    {
        e.printStackTrace();
        this.porxyIp ="0.0.0.0";
        this.proxyPort =0;
        this.proxyType = " ";
        this.proxyStatus = ProxyStatus.Unknown;
    }
    catch(ArrayIndexOutOfBoundsException e1)
    {
          e1.printStackTrace();
            this.porxyIp ="0.0.0.0";
            this.proxyPort =0;
            this.proxyType = " ";
            this.proxyStatus = ProxyStatus.Unknown;
    }
    return this;
    }
    public String getProxyIp() {
        return porxyIp;
    }
    public void setProxyIp(String porxyIp) {
        this.porxyIp = porxyIp;
    }
    public int getProxyPort() {
        return proxyPort;
    }
    public void setProxyPort(int proxyPort) {
        this.proxyPort = proxyPort;
    }
    public String getProxyType() {
        return proxyType;
    }
    public void setProxyType(String proxyType) {
        this.proxyType = proxyType;
    }
    public ProxyStatus getProxyStatus() {
        return proxyStatus;
    }
    public void setProxyStatus(ProxyStatus proxyStatus) {
        this.proxyStatus = proxyStatus;
    }
    
    public byte[] getBytes(){
    return (getProxyIp()+":"+getProxyPort()+"\n").getBytes();
    
    }
  
}
