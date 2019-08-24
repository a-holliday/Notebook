# Notebook
Notebook is a project attempting to be a cloud-based  blog, to-do list, timer and productivity charting app.
Windows Instructions: 
This app requires node.js a collection of libraries that work with web apps (https://nodejs.org/en/download/) and mongodb a database server (https://www.mongodb.com/products/compass). Once you have installed mongodb open a shell create a directory in C:\data\db then tell mongo where to put the databases and which port to use by typing **mongod --port 27017 --dbpath "C:\data\db"** then type **mongod.exe** open another shell and type **mongo.exe** (you may need to be in the **C:\Mongo\DB\bin** filepath for these commands or the place where you installed Mongo. Then in  another terminal  Navigate to root folder ("Notebook")
and run npm init in shell. Then you should be able to run nodemon and use browser to interact with app at localhost/3000.
