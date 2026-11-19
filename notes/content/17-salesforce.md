# Salesforce Developer: Architecture, Apex & LWC Guide
A comprehensive developer notebook covering Salesforce multi-tenant architecture, governor limits, Apex triggers, SOQL/SOSL optimization, Lightning Web Components (LWC), and enterprise CRM integration patterns.

## Salesforce Architecture & Multi-Tenancy
- **What is Multi-Tenancy?** Unlike single-tenant software where each company runs on a dedicated server, Salesforce runs hundreds of thousands of corporate tenants on shared physical infrastructure and shared database clusters (the Force.com kernel).
- **Non-Technical Real-Life Analogy (Apartment Complex vs Private Bungalow):**
  - In a private bungalow, if you leave all the water taps open full blast, only you suffer when your tank runs dry.
  - In a luxury 100-story apartment building, all residents share the same main water supply and electrical substation. If one reckless tenant runs 50 industrial washing machines at midnight, the entire building loses water pressure and lights flicker.
  - **Governor Limits** are the building's automated circuit breakers and flow valves: the moment an apartment draws more than its allotted 15 amps, the fuse immediately trips to protect the rest of the building!

### Governor Limits Cheat Sheet
| Resource / Operation | Synchronous Apex Limit | Asynchronous Apex Limit |
|---|---|---|
| Total SOQL queries issued | 100 queries | 200 queries |
| Total records retrieved by SOQL | 50,000 records | 50,000 records |
| Total DML statements issued | 150 statements | 150 statements |
| Total records processed by DML | 10,000 records | 10,000 records |
| Maximum CPU time on Salesforce servers | 10,000 ms (10 sec) | 60,000 ms (60 sec) |
| Total Heap Size | 6 MB | 12 MB |

@layers Database Kernel (Shared Metadata Architecture) | Tenant Isolation (Org ID Tenant Boundaries) | Governor Limit Enforcement Engine | Custom Apex Runtime & LWC Virtual DOM :: Salesforce Multi-Tenant Execution Hierarchy

## Apex Programming & Trigger Frameworks
- **Apex Characteristics:** Strongly typed, object-oriented, case-insensitive, runs entirely server-side in the cloud.
- **The Golden Rule of Apex:** Always bulkify your code. Never write a SOQL query or DML operation inside a `for` loop!

### Production-Grade Apex Trigger Pattern
```java
// Anti-pattern: BAD (Throws System.LimitException: Too many SOQL queries: 101)
// for (Account acc : Trigger.new) {
//     List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
// }

// Best Practice: Bulkified Trigger Handler
public with sharing class AccountTriggerHandler {
    public static void handleAfterUpdate(List<Account> newAccounts, Map<Id, Account> oldAccountMap) {
        Set<Id> changedAccountIds = new Set<Id>();
        for (Account acc : newAccounts) {
            Account oldAcc = oldAccountMap.get(acc.Id);
            if (acc.Rating != oldAcc.Rating && acc.Rating == 'Hot') {
                changedAccountIds.add(acc.Id);
            }
        }
        
        if (changedAccountIds.isEmpty()) return;
        
        // Single bulkified SOQL query across all affected accounts
        List<Contact> contactsToUpdate = new List<Contact>();
        for (Contact con : [SELECT Id, Priority__c FROM Contact WHERE AccountId IN :changedAccountIds]) {
            con.Priority__c = 'High';
            contactsToUpdate.add(con);
        }
        
        // Single bulkified DML operation (1 of 150 limit)
        if (!contactsToUpdate.isEmpty()) {
            update contactsToUpdate;
        }
    }
}
```
- **Time Complexity:** $O(N)$ where $N$ is the number of processed records.
- **Space Complexity:** $O(N)$ auxiliary heap memory.

@flow [Trigger Event (before/after insert/update)] | [Trigger Dispatcher (One trigger per object)] | [Handler Class (Bulkified logic)] | [Service / Utility Layer (SOQL & DML)] | (Clean Database Commit) :: Modern Salesforce Trigger Framework

## Lightning Web Components (LWC)
- Built on modern standard web components (Shadow DOM, Custom Elements, ECMAScript 6+).
- **Data Binding & Wire Service:**
```javascript
// accountDetail.js
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';

const FIELDS = [NAME_FIELD, INDUSTRY_FIELD];

export default class AccountDetail extends LightningElement {
    @api recordId; // Injected automatically from record page

    // Reactive wire adapter: caches client-side, refreshes on record change
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    account;

    get accountName() {
        return getFieldValue(this.account.data, NAME_FIELD);
    }
}
```

## Salesforce Integration Patterns
- **Synchronous REST / SOAP Callouts:** Named Credentials for secure OAuth2 token management.
- **Event-Driven Architecture:** Platform Events and Change Data Capture (CDC) over CometD / Pub/Sub API.
- **Real-Life Analogy (Platform Events as a Stock Ticker):** Instead of 50 external banking applications polling Salesforce every 2 seconds ("Any new leads? Any new leads?"), Salesforce broadcasts a single Platform Event onto a streaming bus whenever a lead converts. All 50 listeners receive the event instantly without consuming governor limits.
