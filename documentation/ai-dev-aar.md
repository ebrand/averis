# Development with Claude : After-Action Report

During the several days I spent wotking with Claude to develop the Averis system, I learned and documented several best practices.



## 1. Code-First Development
Entity Framework Migrations for each DbContext in-use
Never manually edit DB schemas - let EF be the single source of truth