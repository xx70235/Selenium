proxyline = []
proxyfile = []
try:
    with open('proxy1.txt','r') as proxy, open('proxy.txt','w') as proxy1:
        for each_line in proxy:
           proxyline = each_line.split('\t')
           proxyItem = proxyline[0]+':'+proxyline[1]
           print(proxyItem, file = proxy1)

except IOError as err:
    print(str(err))
