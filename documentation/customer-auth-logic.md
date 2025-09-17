## Averis Customer AUthentication Logic                       

    Cold -> Warm -> Hot Authentication

### Cold Authentication:
    
#### First-Time Visitors

An anonymous person visits the Ecommerce UI. If they don't have Averis cookie, we create and save one. We then create an "Visitor" account (Customer with the 'visitor_flag' = true) for them (saving this ID in the cookie). We now have an account to use for this user, collecting telemetry from their visit.

#### Returning Visitors

If they do have an Averis cookie, we attempt to load the Visitor/Customer record and load that information, if found, into the Customer Context. If no Visitor/Customer account is found, we proceed as if a new cookie had just been created.

### Warm Authentication:

Once a visitor utilizes our cart and checkout funnel - therefore requiring them to enter their PII and/or PCI data - we search for an existing Customer record. by the entered email address.

##### Returning Customer / Existing Account Conflict
If a Customer record is found for the provided email address, we notify the user that an account already exists and ask them to authenticate. If successful, we associate the visitor with the identified Customer, ensure any telemetry and other state collected on the Visitor is transferred to the authenticated Customer. If they cannot authenticate, we ask that they provide a different email address to use for their account.

#### New Customer

If we do not find one, we apply the entered PII and/or PCI (with the user's opt-in) to the Visitor account and clear the 'visitor_flag', thus making this entity a full-fledged customer (as we know enough about them to treat them as such - Name, address, telephone, email, PCI). At this time, we ask if they would like to associate their customer account with Google, Apple, Facebook, Meta, etc. and utilize Stytch to do the proper authentication flow, associating their Customer record with their Stytch ID. We can also offer the option for the user to login using a validation e-mail (Stytch "magic" e-mail) and providing a password.

### Hot Authentication:

In certain scenarios, we present the user with a (Stytch) authentication screen. If they successfully authenticate, we associate this user with their authenticated Customer account.

## User Account Structure
```
{
    "id": "cfe0df05-7756-4d0e-888b-0a0df3fe20e3",
    "stytch_user_id": "fe17e5b0-78cd-4409-856d-8bab22e343f6",
    "first_name": "Joseph",
    "last_name": "Blow",
    "email": "joe.blow@example.com",
    "password": null,
    "roles": "['prouct_marketing', 'product_marketing_approve', 'customer'],
    "status": "active",
    "last_login": "2025-08-26 22:37:40.308755",
    "updated_at": "2025-08-26 22:37:40.308755",
    "updated_by": "Susie Schmukliptz",
    "created_at": "2025-08-26 22:37:40.308755",
    "created_by": "Susie Schmukliptz",
    "telemetry": {
        ...
    },
    
    "customer_data": {
        "customer_id": "",
        "billing_address": {

        },
        "shipping_address": {

        },
        ...
    }
}
```

The "telemetry" object could be used by the E-Commerce site or by the Averis platform in general for statistical analysis in either domain. If their User record has the 'customer' role, the "customer_data" object would be populated.

|Current Schema|New Schema|
|:-|:-|
|-|averis_system (new)|
|averis_customer|averis_customer|
|averis_ecomm|averis_ecomm|
|averis_pricing|averis_pricing|
|averis_product|averis_product|
|product_cache|averis_product_staging|