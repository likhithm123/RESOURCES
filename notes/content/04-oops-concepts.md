# OOP Concepts - Principles, SOLID and Design Patterns (C++, Java, Python)
Object-Oriented Programming is asked in every SDE interview. This notebook explains every concept with a real-world analogy, a diagram and code in C++, Java and Python, then SOLID, UML, design patterns and the most asked questions.
## Why OOP
- **Procedural** code = data + functions that act on it separately. As programs grow, any function can change any data -> bugs and tangled code.
- **OOP** bundles data and the functions that operate on it into **objects** that model real things (Account, Order, Car). Benefits: modularity, reuse, easier change, real-world modelling, team work on separate classes.
@layers OOP | Encapsulation, Abstraction, Inheritance, Polymorphism | Class, Object, Message passing :: Four pillars resting on classes and objects
## Class and Object
- **Class** = blueprint/template (like the house plan). **Object** = an instance built from it (an actual house). One class, many objects, each with its own state.
- An object has **state** (fields / attributes), **behaviour** (methods) and **identity** (its own memory address).
@chain class Car (plan) -> new Car("red") -> object car1 at 0x100 :: Instantiation
```cpp
class Car {
public:
    string color; int speed = 0;
    Car(string c) : color(c) {}
    void accelerate(int d) { speed += d; }
};
Car c1("red"), c2("blue"); c1.accelerate(20);    // c2.speed is still 0
```
```java
class Car {
    String color; int speed = 0;
    Car(String color) { this.color = color; }
    void accelerate(int d) { speed += d; }
}
Car c1 = new Car("red"); c1.accelerate(20);
```
```py
class Car:
    def __init__(self, color): self.color, self.speed = color, 0
    def accelerate(self, d): self.speed += d
c1 = Car("red"); c1.accelerate(20)
```
## Encapsulation
- **Hide** the internal state and expose only safe operations. Like a capsule: the medicine is inside; you just swallow it. Like an ATM: you cannot touch the cash drawer, only use the buttons.
- Done with private fields + public methods that **validate** (invariants such as "balance never negative" always hold).
@layers Public interface: deposit(), withdraw(), getBalance() | Private data: balance, pin :: Encapsulated BankAccount
```java
public class Account {
    private double balance;                       // cannot be changed from outside directly
    public void deposit(double amt) {
        if (amt <= 0) throw new IllegalArgumentException("invalid amount");
        balance += amt;
    }
    public double getBalance() { return balance; }
}
```
```py
class Account:
    def __init__(self): self._balance = 0          # _ = internal by convention, __ = name mangled
    @property
    def balance(self): return self._balance
    def deposit(self, amt):
        if amt <= 0: raise ValueError("invalid amount")
        self._balance += amt
```
## Abstraction
- Show **what** an object does, hide **how**. You drive a car with a steering wheel and pedals without knowing how fuel injection works.
- Achieved with abstract classes and interfaces. Encapsulation hides data; abstraction hides complexity/implementation.
```java
interface PaymentGateway { boolean pay(double amount); }       // what
class RazorpayGateway implements PaymentGateway {               // how (hidden)
    public boolean pay(double amount) { /* call Razorpay API, sign request, handle retries */ return true; }
}
class Checkout {
    private final PaymentGateway gateway;                       // depends only on the abstraction
    Checkout(PaymentGateway g) { gateway = g; }
    void placeOrder(double total) { if (gateway.pay(total)) System.out.println("order placed"); }
}
```
```cpp
class PaymentGateway { public: virtual bool pay(double amount) = 0; virtual ~PaymentGateway() = default; };
class StripeGateway : public PaymentGateway { public: bool pay(double a) override { return true; } };
```
```py
from abc import ABC, abstractmethod
class PaymentGateway(ABC):
    @abstractmethod
    def pay(self, amount: float) -> bool: ...
class UpiGateway(PaymentGateway):
    def pay(self, amount): return True
```
## Inheritance
- A child class acquires fields and methods of a parent ("is-a"): a Manager **is an** Employee. Enables code reuse and polymorphism.
| Type | Shape | Supported in |
|---|---|---|
| Single | A -> B | all |
| Multilevel | A -> B -> C | all |
| Hierarchical | A -> B, A -> C | all |
| Multiple | A, B -> C | C++, Python (Java only via interfaces) |
| Hybrid | mix (diamond) | C++ (virtual), Python (MRO) |
@tree Vehicle(Car(ElectricCar),Bike,Truck) :: Hierarchical + multilevel inheritance
```py
class Vehicle:
    def __init__(self, wheels): self.wheels = wheels
    def describe(self): return f"{self.wheels} wheels"
class Car(Vehicle):
    def __init__(self): super().__init__(4)
class ElectricCar(Car):
    def describe(self): return super().describe() + ", battery powered"
print(ElectricCar().describe())      # 4 wheels, battery powered
```
- **Diamond problem**: D inherits B and C, both inherit A - which A? C++ uses virtual inheritance, Python uses the MRO (C3 linearisation), Java forbids multiple class inheritance (default methods in interfaces must be resolved explicitly).
## Polymorphism
- "Many forms": the same call behaves differently based on the object.
| | Compile-time (static) | Run-time (dynamic) |
|---|---|---|
| how | overloading, operator overloading, templates/generics | overriding + virtual dispatch |
| decided | by the compiler from argument types | by the actual object type at run time |
| example | add(int,int) / add(double,double) | shape.area() on Circle vs Square |
```cpp
struct Shape { virtual double area() const = 0; virtual ~Shape() = default; };
struct Circle : Shape { double r; Circle(double r) : r(r) {} double area() const override { return 3.14159 * r * r; } };
struct Square : Shape { double s; Square(double s) : s(s) {} double area() const override { return s * s; } };
double totalArea(const vector<Shape*>& v) { double t = 0; for (auto* s : v) t += s->area(); return t; }   // one call, many forms
```
```java
List<Shape> shapes = List.of(new Circle(1), new Square(2));
for (Shape s : shapes) System.out.println(s.area());    // dynamic dispatch
```
```py
for s in [Circle(1), Square(2)]: print(s.area())        # duck typing: anything with .area() works
```
- **Upcasting** (child -> parent reference) is automatic and safe. **Downcasting** needs a check (`instanceof`, `dynamic_cast`).
## Relationships Between Classes
| Relationship | Meaning | Example | Lifetime |
|---|---|---|---|
| Association | uses / knows | Teacher - Student | independent |
| Aggregation | has-a (weak) | Department has Professors | parts live on without whole |
| Composition | has-a (strong) | House has Rooms | parts die with the whole |
| Inheritance | is-a | Dog is an Animal | - |
| Dependency | temporarily uses | Order uses PaymentService in a method | method call |
@chain House <>-- Room (composition) -> Department <>-- Professor (aggregation) -> Teacher --- Student (association) :: UML relationship arrows
> Rule: **favour composition over inheritance**. Inheritance couples child to parent internals; composition lets you swap parts at run time (Strategy pattern).
## Other Core Concepts
- **Constructor / destructor**: initialise / clean up an object. Overloaded constructors, copy constructors (C++), constructor chaining (`this(...)`, `super(...)`).
- **Static members**: belong to the class, shared across objects (counters, factory methods, constants).
- **Interfaces vs abstract classes**: interface = pure contract ("can-do"), abstract class = partial implementation ("is-a" with shared code).
- **Method overriding rules**: same signature, cannot reduce visibility, covariant return types allowed, `final`/`sealed` blocks overriding.
- **Coupling** (how much classes depend on each other) should be **low**; **cohesion** (how focused a class is) should be **high**.
- **Object cloning**: shallow vs deep copy.
- **Message passing**: objects interact by calling each other's methods.
## SOLID Principles
### S - Single Responsibility Principle
- A class should have **one reason to change**. Split "Invoice that calculates, prints and saves itself" into Invoice, InvoicePrinter, InvoiceRepository.
```java
class Invoice { double total() { return 0; } }                     // business rules only
class InvoicePrinter { void print(Invoice i) { } }                  // presentation
class InvoiceRepository { void save(Invoice i) { } }                // persistence
```
### O - Open/Closed Principle
- Open for **extension**, closed for **modification**: add new behaviour by adding classes, not editing tested code.
```py
class Discount(ABC):
    @abstractmethod
    def apply(self, amount): ...
class FestivalDiscount(Discount):
    def apply(self, amount): return amount * 0.8
class StudentDiscount(Discount):            # new rule = new class, no if-else edits
    def apply(self, amount): return amount * 0.9
def checkout(amount, discount: Discount): return discount.apply(amount)
```
### L - Liskov Substitution Principle
- Objects of a subclass must be usable wherever the parent is expected **without breaking correctness**. Classic violation: Square extends Rectangle - setting width on a Square also changes height, breaking code that expects a Rectangle. Fix: a common Shape interface instead.
- Another violation: a Penguin that extends Bird but throws on fly(). Fix: split FlyingBird from Bird.
### I - Interface Segregation Principle
- Clients should not depend on methods they do not use. Split a fat `Worker {work(); eat();}` into `Workable` and `Eatable`, so a Robot implements only Workable.
### D - Dependency Inversion Principle
- High-level modules depend on **abstractions**, not concrete classes. Inject dependencies (constructor injection) - this enables testing with mocks and swapping implementations.
```java
interface MessageSender { void send(String to, String msg); }
class EmailSender implements MessageSender { public void send(String to, String m) { } }
class SmsSender implements MessageSender { public void send(String to, String m) { } }
class OtpService {
    private final MessageSender sender;                 // abstraction
    OtpService(MessageSender sender) { this.sender = sender; }     // injected
    void sendOtp(String user) { sender.send(user, "Your OTP is 4821"); }
}
```
### Other principles
- **DRY** (Don't Repeat Yourself), **KISS** (Keep It Simple), **YAGNI** (You Aren't Gonna Need It), **Law of Demeter** (talk only to immediate friends: avoid a.getB().getC().do()), **Composition over inheritance**, **Program to an interface**.
## UML Class Diagrams
- A box with three parts: class name / attributes / methods. Visibility: + public, - private, # protected.
@layers Order | - id: long, - items: List, - status: Status | + addItem(i), + total(): double, + checkout() :: UML class box
| Arrow | Meaning |
|---|---|
| solid line + hollow triangle | inheritance (extends) |
| dashed line + hollow triangle | implements interface |
| solid line + filled diamond | composition |
| solid line + hollow diamond | aggregation |
| solid line / arrow | association |
| dashed arrow | dependency |
## Design Patterns
- Reusable solutions to common design problems (Gang of Four, 23 patterns): **creational** (how objects are created), **structural** (how they are composed), **behavioural** (how they communicate).
### Singleton (creational)
- Exactly one instance with a global access point: config, logger, connection pool. Beware: hidden global state, harder testing; make it thread-safe.
```java
public final class Config {
    private static volatile Config instance;
    private Config() {}
    public static Config get() {
        if (instance == null) {
            synchronized (Config.class) {
                if (instance == null) instance = new Config();      // double-checked locking
            }
        }
        return instance;
    }
}
// simplest thread-safe form: public enum Config2 { INSTANCE; }
```
```py
class Logger:
    _instance = None
    def __new__(cls):
        if cls._instance is None: cls._instance = super().__new__(cls)
        return cls._instance
```
### Factory Method (creational)
- Create objects without exposing the concrete class; the caller asks by type.
```java
interface Notification { void send(String msg); }
class EmailNotification implements Notification { public void send(String m) { } }
class PushNotification implements Notification { public void send(String m) { } }
class NotificationFactory {
    static Notification create(String channel) {
        return switch (channel) {
            case "email" -> new EmailNotification();
            case "push" -> new PushNotification();
            default -> throw new IllegalArgumentException(channel);
        };
    }
}
```
### Abstract Factory, Builder, Prototype (creational)
- **Abstract Factory**: families of related objects (DarkThemeFactory creates DarkButton + DarkCheckbox).
- **Builder**: build complex objects step by step with readable code; avoids telescoping constructors.
- **Prototype**: create new objects by cloning an existing one.
```java
class Pizza {
    private final String size; private final boolean cheese, olives;
    private Pizza(Builder b) { size = b.size; cheese = b.cheese; olives = b.olives; }
    static class Builder {
        private String size = "M"; private boolean cheese, olives;
        Builder size(String s) { size = s; return this; }
        Builder cheese() { cheese = true; return this; }
        Builder olives() { olives = true; return this; }
        Pizza build() { return new Pizza(this); }
    }
}
Pizza p = new Pizza.Builder().size("L").cheese().build();
```
### Adapter, Decorator, Facade, Proxy, Composite (structural)
- **Adapter**: converts one interface to another (old XML payment SDK wrapped to look like our PaymentGateway).
- **Decorator**: add behaviour at run time by wrapping (Coffee -> MilkDecorator -> SugarDecorator; Java I/O streams).
- **Facade**: one simple interface over a complex subsystem (`OrderFacade.placeOrder()` calls inventory, payment, shipping).
- **Proxy**: a stand-in that controls access (lazy loading, caching, auth checks, remote calls).
- **Composite**: treat a group like a single object (folders containing files and folders).
```py
class Coffee:
    def cost(self): return 50
class Milk:
    def __init__(self, inner): self.inner = inner
    def cost(self): return self.inner.cost() + 15
class Sugar:
    def __init__(self, inner): self.inner = inner
    def cost(self): return self.inner.cost() + 5
print(Sugar(Milk(Coffee())).cost())        # 70 - decorators stack
```
@chain Sugar -> Milk -> Coffee :: Decorator chain: each wraps the next
### Observer, Strategy, Command, State, Template Method, Chain of Responsibility (behavioural)
- **Observer**: subscribers are notified when a subject changes (YouTube channel -> subscribers, event listeners, pub/sub).
- **Strategy**: swap algorithms at run time (payment by UPI / card / wallet; sorting strategy).
- **Command**: wrap a request as an object (undo/redo, job queues).
- **State**: an object changes behaviour when its state changes (vending machine: Idle -> HasMoney -> Dispensing).
- **Template Method**: base class fixes the algorithm skeleton, subclasses fill steps.
- **Chain of Responsibility**: pass a request along handlers until one handles it (middleware, logging levels, approval chains).
- **Iterator**, **Mediator** (chat room), **Memento** (snapshots), **Visitor** also exist.
```java
interface Subscriber { void update(String video); }
class Channel {
    private final List<Subscriber> subs = new ArrayList<>();
    void subscribe(Subscriber s) { subs.add(s); }
    void upload(String video) { subs.forEach(s -> s.update(video)); }      // notify all
}
interface PaymentStrategy { void pay(int amount); }
class UpiPayment implements PaymentStrategy { public void pay(int a) { System.out.println("UPI " + a); } }
class CardPayment implements PaymentStrategy { public void pay(int a) { System.out.println("Card " + a); } }
class Cart { private PaymentStrategy strategy; void setStrategy(PaymentStrategy s) { strategy = s; } void checkout(int a) { strategy.pay(a); } }
```
```py
class Handler:
    def __init__(self, nxt=None): self.nxt = nxt
    def handle(self, amount):
        return self.nxt.handle(amount) if self.nxt else "rejected"
class TeamLead(Handler):
    def handle(self, amount): return "lead approved" if amount <= 1000 else super().handle(amount)
class Manager(Handler):
    def handle(self, amount): return "manager approved" if amount <= 10000 else super().handle(amount)
print(TeamLead(Manager()).handle(5000))       # manager approved
```
| Pattern | Use when | Real example |
|---|---|---|
| Singleton | one shared instance | logger, DB pool |
| Factory | create by type | notification channels |
| Builder | many optional params | HTTP request builders |
| Adapter | incompatible interfaces | legacy SDK wrapper |
| Decorator | add features at run time | middleware, I/O streams |
| Facade | simplify a subsystem | checkout service |
| Observer | one-to-many events | UI events, Kafka consumers |
| Strategy | interchangeable algorithms | pricing, payment |
| State | behaviour depends on state | order life cycle, vending machine |
| Command | undo/queue requests | text editor |
## OOP Design Case Study: Parking Lot
@layers ParkingLot | Floor | Spot (Small, Medium, Large) | Vehicle (Bike, Car, Truck), Ticket, Payment :: Classes in a parking lot design
```java
enum SpotSize { SMALL, MEDIUM, LARGE }
abstract class Vehicle { abstract SpotSize size(); String plate; }
class Car extends Vehicle { SpotSize size() { return SpotSize.MEDIUM; } }
class Bike extends Vehicle { SpotSize size() { return SpotSize.SMALL; } }
class Spot { final int id; final SpotSize size; Vehicle parked; Spot(int id, SpotSize s) { this.id = id; size = s; } boolean free() { return parked == null; } }
class Ticket { final Vehicle v; final Spot spot; final long inTime = System.currentTimeMillis(); Ticket(Vehicle v, Spot s) { this.v = v; spot = s; } }
class ParkingLot {
    private final List<Spot> spots = new ArrayList<>();
    private final Map<String, Ticket> active = new HashMap<>();
    synchronized Ticket park(Vehicle v) {
        for (Spot s : spots) if (s.free() && s.size.ordinal() >= v.size().ordinal()) { s.parked = v; Ticket t = new Ticket(v, s); active.put(v.plate, t); return t; }
        throw new IllegalStateException("lot full");
    }
    synchronized long unpark(String plate) {
        Ticket t = active.remove(plate); t.spot.parked = null;
        long hours = Math.max(1, (System.currentTimeMillis() - t.inTime) / 3_600_000);
        return hours * 40;                          // fee strategy could be injected (Strategy pattern)
    }
}
```
More LLD case studies (elevator, BookMyShow, Splitwise, rate limiter, LRU) are in notebook 12.
## OOP Interview Questions
Q: What are the four pillars of OOP?
A: Encapsulation (hide data behind methods), Abstraction (expose what, hide how), Inheritance (reuse via is-a), Polymorphism (one interface, many implementations).
Q: Encapsulation vs abstraction?
A: Encapsulation is about protecting data (access control); abstraction is about hiding implementation complexity behind a simple interface.
Q: Overloading vs overriding?
A: Overloading: same name, different parameters, compile-time. Overriding: subclass redefines a parent method with the same signature, run-time.
Q: Abstract class vs interface?
A: Abstract classes can have state, constructors and concrete code but allow single inheritance; interfaces declare contracts, allow multiple implementation.
Q: Can we override static or private methods?
A: No. Static methods are hidden (resolved by reference type), private methods are not visible to subclasses.
Q: What is the diamond problem and how do languages solve it?
A: Ambiguity when two parents share an ancestor; C++ virtual inheritance, Python MRO, Java disallows multiple class inheritance.
Q: Composition vs inheritance - which is better?
A: Composition is preferred: looser coupling, run-time flexibility, avoids fragile base class problems; use inheritance only for genuine is-a with substitutability (LSP).
Q: What is a virtual function / vtable?
A: A function dispatched at run time through a per-class table of function pointers referenced by each object's hidden vptr.
Q: Explain SOLID with one example each.
A: SRP: separate Invoice from InvoicePrinter. OCP: new Discount subclass instead of if-else. LSP: Square should not extend Rectangle. ISP: split Worker into Workable/Eatable. DIP: OtpService depends on MessageSender interface.
Q: What is coupling and cohesion?
A: Coupling is the degree of dependency between modules (want low); cohesion is how strongly a module's responsibilities belong together (want high).
Q: What is the difference between association, aggregation and composition?
A: Association: classes know each other. Aggregation: whole-part where parts can exist independently. Composition: whole owns parts; parts die with it.
Q: How is a singleton made thread-safe?
A: Eager initialisation, double-checked locking with volatile, static holder class, enum (Java), function-local static (C++11).
Q: What is object slicing in C++?
A: Assigning a derived object to a base object by value copies only the base part, losing derived data and behaviour; use pointers/references.
Q: Why should constructors not call virtual functions?
A: During base construction the derived part does not exist yet, so the base version is called (C++), or the derived override sees uninitialised fields (Java).
