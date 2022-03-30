import erdpy.environments
from erdpy.accounts import Account
from erdpy.config import DEFAULT_GAS_PRICE,get_tx_version,get_chain_id
from erdpy.proxy import ElrondProxy
from erdpy.transactions import Transaction

from OpenAlumni.Tools import log
from OpenAlumni.settings import NFT_CONTRACT, TOKEN_ID, BC_PROXY, ADMIN_PEMFILE, BC_EXPLORER, NFT_CREATE_COST


def toHex(letters,zerox=False):
    rc = ""
    if type(letters)==int:
        rc=hex(letters).replace("0x","")
        if len(rc) % 2 == 1:rc="0"+rc
        return rc

    for letter in letters:
        rc=rc+hex(ord(letter))[2:]

    if len(rc) % 2==1:rc="0"+rc

    if zerox:
        return "0x"+rc
    else:
        return rc


def hex_to_str(number):
    number=hex(number)[2:]
    rc=""
    for i in range(0,len(number),2):
        rc=rc+chr(int(number[i:i+2],16))
    return rc




class NFTservice:
    def __init__(self, proxy=BC_PROXY,pem_file=ADMIN_PEMFILE):
        self._proxy = ElrondProxy(proxy)
        self.chain_id = self._proxy.get_chain_id()
        self.environment = erdpy.TestnetEnvironment(proxy)
        log("Initialisation de l'admin avec "+pem_file)
        self._sender=Account(pem_file=pem_file)



    def execute(self,data,_sender=None,value="0",receiver=NFT_CONTRACT,gasLimit=60000000):
        if _sender is None:_sender=self._sender
        _sender.sync_nonce(self._proxy)

        t = Transaction()
        t.nonce = _sender.nonce
        t.version = get_tx_version()
        t.data = data
        t.receiver = receiver
        t.chainID = self._proxy.get_chain_id()
        t.gasLimit = gasLimit
        t.value = value
        t.sender = self._sender.address.bech32()
        t.gasPrice = DEFAULT_GAS_PRICE
        t.sign(self._sender)

        log("Execution d'une transaction sur "+BC_EXPLORER+"/address/"+t.sender)
        rc=t.send_wait_result(self._proxy, 60000)

        for r in rc["smartContractResults"]:
            if "data" in r:
                r["result"]=list()
                for p in r["data"].split("@"):
                    if len(p)>0:
                        r["result"].append(hex_to_str(int(p,16)))

        return rc["smartContractResults"]



    def init_token(self):
        rc = self.execute("issueNonFungible@" + toHex("FEMISToken", False) + "@" + toHex("FEMIS", False),self._sender, NFT_CREATE_COST)
        if len(rc)>0 and len(rc[0]["result"])>1:
            token_id=rc[0]["result"][1]
            log("Création de "+token_id)
            rc=self.execute("setSpecialRole@" + toHex(token_id,False) + "@" + self._sender.address.hex() + "@" + toHex("ESDTNFTCreate",False))
        return rc



    def post(self,title,content,occ=1):
        #voir https://docs.elrond.com/developers/nft-tokens/
        #rc=self.execute("issueNonFungible@"+str_to_hex("FEMISToken",False)+"@"+str_to_hex("FEMIS",False),self._sender,"5000000000000000000")
        #rc=self.execute("setSpecialRole@"+toHex(token_id)+"@"+self._sender.address.hex()+"@"+toHex("ESDTRoleNFTCreate"))
        hash=0
        data="ESDTNFTCreate@"+toHex(TOKEN_ID)+"@"+toHex(occ)+"@"+toHex(title)+"@"+toHex(0)+"@"+toHex(hash)+"@"+toHex(content)+"@"+toHex("https://dcp.f80lab.com")
        rc=self.execute(data,receiver=self._sender.address.bech32(),gasLimit=60000000+len(content+title)*1500)

        return rc
