import random
from time import sleep

from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.keys import Keys


class Bot:

    def __init__(self,url):
        self.driver: WebDriver = WebDriver(desired_capabilities=DesiredCapabilities.CHROME)
        self.driver.implicitly_wait(1)
        self.driver.get(url)
        self.driver.set_window_rect(0,0,800,1000)

    def login(self, username, password):
        elt=self.driver.find_element_by_class_name("accept")
        elt.click()
        sleep(2)

        elt=self.driver.find_element_by_class_name("bouton_login")
        elt.click()
        sleep(1)

        elt=self.driver.find_element_by_id("modlgn-username")
        elt.send_keys(username)

        elt=self.driver.find_element_by_id("modlgn-passwd")
        elt.send_keys(password)
        sleep(1)

        elt.send_keys(Keys.ENTER)
        sleep(1)


    def download_page(self,url):
        self.driver.set_page_load_timeout(3600)
        self.driver.get(url)
        sleep(random.randint(3000, 20000) / 1000)
        html=self.driver.page_source
        return html

    def quit(self):
        self.driver.quit()











