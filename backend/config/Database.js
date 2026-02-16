import { Sequelize } from "sequelize";

// کدی هستش که میخواد ما رو به دیتابیس خودمون متصل کنه 
const db = new Sequelize("news_website","mohammadreza","Rcf!NtmUy*skymfd",{
    host:"localhost",
    dialect:"mysql",
});



export default db; 
