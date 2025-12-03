# Local Website Review README.md File

### Some know abouts
- **Frontend:** HTML5, CSS3, Vanilla Javascript
- **Backend:** Node.js with Express.js
- **Database:** SQLite
- **Auth:** Bcrypt password hashing, HTTP-only cookies
- **Security:** Simple math captcha for spam prevention
---
**How to run - The Basic Steps**

Please read **Before Running**

There is a file named **RUN-THIS.bat**. This script will setup the needed packages on your computer to be able to run the server and host the website.
This is the basic way to setup your computer to host, but there are some steps you need to take to make sure that the script starts correctly.


### **Before Running**
1. Ensure your computer has scripts turned on.
   
To do this open settings and in the search bar type _script_.
You should see something that says "_Allow local powershell scripts to run without being signed_".
This needs to be enabled to run the server and to install the needed packages

2. With scripts enabled you should now be able to run **RUN-THIS.bat** without any issues.

<br>

## If (Issues == True) {Do below}
If you come across any issues while trying to set up the server for hosting here are some steps to ensure you can overcome it.

Identify the point of failure. 
- Did you enable scripts? 
- Did it not install Node.js and/or NPM?
- Port Error
- Did you double click the file to run?

  
Depending on the issue, you can follow the steps below.

### 📄 Enable Scripts 
To do this open settings and in the search bar type _script_.
You should see something that says "_Allow local powershell scripts to run without being signed_".

This needs to be enabled to run the server and to install the needed packages

2. With scripts enabled you should now be able to run **RUN-THIS.bat** without any issues.

---

### 📩 Failed Node.js and/or NPM install 
This can be caused by scripts being disabled so please see **Enable Scripts** and make sure it's on.

To fix the install of Node.js and NPM you can manually install.
1. Navigate to the install website => https://nodejs.org/en/download
2. Select the version v24.11.1 for Windows. Other option should be left default (using _Docker_ with _NPM_)
3. Download the executable and run it once its installed (It will show a install wizard, just click next for all options till install, then click install)
4. Select allow changes when prompted

With these steps you should be able to see the server and it should start.

---

### ⚓ Change Port
The website is hosted on port 3000. You might find a port error. If so, follow these steps.
1. Inside the folder with the script called **server.js** (same as the one with this README.md file), find a blank area to right click with your mouse.
2. Click on "_open in terminal_"
3. Type the following into the terminal (submitting after each one):
```Bash
tasklist
taskkill /f /im node.exe
taskkill /pid 3000 /f
```
NOTE: These can be case sysitive. If it fails and it says "Unknown command (or something similar)" try capitalizing terms like 'PID', 'IM', and/or 'F'.

<br>

## Other
Here are some other things to know.

### Manually Start the Server
If you have successfully started the server by using the script, you don't have to use it every time to start the server.

You can follow these steps to start it yourself:
1. Inside the folder with the script called **server.js** (also in the same folder as this README.md), find a blank area to right click with your mouse.
2. Click on "_open in terminal_"
3. Type the following into the terminal (submitting after each one):
```Bash
npm install
npm run init-db
npm start
```
<br>

### Breakdown of Bash
When you manually start the server you use NPM commands to do this. I'll explain what each does briefly.
1. This reads the file named _packages.json_ and installs the dependencies that the website needs to run correctly
```Bash
npm install
```
2. This initializes the database
```Bash
npm run init-db
```
3. This starts the server and opens the website to your browser
```Bash
npm start
```
<br>

### Hosting
The website is hosted on port 3000. You might find a port error. If so, follow these steps.
1. Inside the folder with the script called **server.js** (same as the one with this README.md file), find a blank area to right click with your mouse.
2. Click on "_open in terminal_"
3. Type the following into the terminal (submitting after each one):
```Bash
tasklist
taskkill /f /im node.exe
taskkill /pid 3000 /f
```
NOTE: These can be case sysitive. If failed and it says "Unknown command (or something simular)" try capitalizing terms like 'PID', 'IM', and/or 'F'.

