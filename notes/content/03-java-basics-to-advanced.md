# Java - From Zero to Advanced OOP, Collections, Streams and Spring Boot
Java is the most used language in large companies (banks, Amazon, Flipkart, Google back ends, Android). This notebook builds it up from the first program to the JVM internals, multithreading, collections, streams, JDBC, Spring Boot and interview questions.
## Getting Started
### What is Java and the JVM
- Java (1995, James Gosling, Sun -> Oracle): object-oriented, strongly and statically typed, garbage collected. Motto: **write once, run anywhere**.
- Source (.java) is compiled by `javac` into **bytecode** (.class). The **JVM** runs bytecode on any OS, using an interpreter plus a **JIT** compiler that turns hot code into native machine code.
@chain Hello.java -> javac -> Hello.class (bytecode) -> JVM: class loader -> verifier -> interpreter + JIT -> OS / CPU :: Java execution
| Term | Meaning |
|---|---|
| JDK | Development Kit: compiler, tools, JRE |
| JRE | Runtime Environment: JVM + core libraries |
| JVM | Virtual Machine that executes bytecode |
| LTS versions | 8, 11, 17, 21, 25 |
```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```
```sh
javac Hello.java && java Hello        # or simply: java Hello.java (single file, Java 11+)
```
- `public` = visible everywhere, `static` = belongs to the class (the JVM calls main without an object), `void` = returns nothing, `String[] args` = command-line arguments.

### Why Java Has No Header Files: Packages and Imports Explained
- **The Speed-Dial Phonebook Analogy:**
  - Beginners often ask: *"Where are the `.h` header files in Java like in C++?"*
  - In C++, you have to write declarations in a separate header file so other files know what functions exist. `#include` literally pastes that text into your file.
  - In **Java**, there are **NO header files**. Java packages and compiled `.class` files are self-describing: bytecode contains all method signatures, parameter types, and bytecode logic together.
  - An `import java.util.ArrayList;` does **not** copy code or slow down execution. It is simply a **speed-dial shortcut in your phonebook**:
    - Without the import, you would have to write the full postal address every single time: `java.util.ArrayList<String> list = new java.util.ArrayList<>();`.
    - With `import java.util.ArrayList;`, you can simply write `ArrayList<String> list = new ArrayList<>();`. The compiler knows which drawer to look in.
- **Packages as City Zip Codes:**
  - Packages (`package com.mybank.payment;`) prevent naming collisions. Two companies can both have a class named `Account` because one is `com.banka.Account` and the other is `com.bankb.Account`.

## Variables, Data Types and Operators
| Primitive | Size | Default | Example |
|---|---|---|---|
| byte | 1 byte | 0 | byte b = 10; |
| short | 2 bytes | 0 | short s = 300; |
| int | 4 bytes | 0 | int n = 42; |
| long | 8 bytes | 0L | long big = 9_000_000_000L; |
| float | 4 bytes | 0.0f | float f = 2.5f; |
| double | 8 bytes | 0.0 | double d = 3.14; |
| char | 2 bytes (UTF-16) | 0 | char c = 'A'; |
| boolean | JVM-defined | false | boolean ok = true; |
- Everything else is a **reference type** (objects, arrays, String). Wrapper classes (Integer, Double...) box primitives; **autoboxing** converts automatically.
```java
int a = 7, b = 2;
System.out.println(a / b + " " + a % b + " " + (double) a / b);   // 3 1 3.5
var list = new ArrayList<String>();       // local type inference (Java 10)
final int MAX = 100;                      // constant
Integer x = 127, y = 127; System.out.println(x == y);   // true (cached -128..127)
Integer p = 128, q = 128; System.out.println(p == q);   // false! compare with equals()
long l = Integer.MAX_VALUE + 1;           // overflow happens before widening: use 1L
String s = String.valueOf(5); int n = Integer.parseInt("123");
```
## Input / Output and Control Flow
```java
import java.util.Scanner;
Scanner sc = new Scanner(System.in);
int n = sc.nextInt(); String name = sc.next(); sc.nextLine(); String line = sc.nextLine();
System.out.printf("%s is %d years%n", name, n);
// fast input for big data: BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
if (n > 0) { } else if (n == 0) { } else { }
String day = "MON";
String type = switch (day) {               // switch expression (Java 14)
    case "SAT", "SUN" -> "weekend";
    default -> "weekday";
};
for (int i = 0; i < 5; i++) { }
for (int v : new int[]{1, 2, 3}) { }       // enhanced for
while (n-- > 0) { }
do { } while (false);
outer: for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) if (j == 1) continue outer;   // labelled
```
## Arrays and Strings
```java
int[] arr = {5, 2, 9}; int[] zeros = new int[10];
int[][] grid = new int[3][4];
Arrays.sort(arr); Arrays.toString(arr); Arrays.fill(zeros, -1); int[] copy = Arrays.copyOf(arr, 5);
String s = "Hello";
s.length(); s.charAt(0); s.substring(1, 3); s.indexOf("l"); s.toUpperCase();
s.equals("hello"); s.equalsIgnoreCase("hello"); s.compareTo("Help");
String[] parts = "a,b,c".split(","); String joined = String.join("-", parts);
StringBuilder sb = new StringBuilder();     // mutable, use in loops
for (int i = 0; i < 5; i++) sb.append(i);
sb.reverse().toString();
String text = """
    multi-line text block (Java 15)
    """;
```
- **String is immutable** and stored in the **String pool**: `"hi" == "hi"` is true (same pooled object), but `new String("hi") == "hi"` is false. Always compare content with `equals()`.
- StringBuilder (not thread-safe, fast) vs StringBuffer (synchronized, slower).
## Methods
```java
static int add(int a, int b) { return a + b; }
static double add(double a, double b) { return a + b; }   // overloading
static int sum(int... nums) { int s = 0; for (int x : nums) s += x; return s; }   // varargs
static void change(int x, int[] arr) { x = 99; arr[0] = 99; }
// Java is ALWAYS pass-by-value. For objects the VALUE is the reference,
// so the method can mutate the object but cannot make the caller's variable point elsewhere.
```
## Math Class, Rounding and Number Formatting
### java.lang.Math - every common function
| Method | Result | Example |
|---|---|---|
| Math.abs(x) | absolute value | Math.abs(-7) = 7 |
| Math.max(a, b) / Math.min(a, b) | larger / smaller | Math.max(3, 9) = 9 |
| Math.pow(a, b) | a to the power b (double) | Math.pow(2, 10) = 1024.0 |
| Math.sqrt(x) / Math.cbrt(x) | square / cube root | Math.sqrt(49) = 7.0 |
| Math.round(x) | nearest integer (half up), returns long/int | Math.round(2.5) = 3, Math.round(-2.5) = -2 |
| Math.floor(x) | largest integer <= x (double) | Math.floor(2.9) = 2.0, Math.floor(-2.1) = -3.0 |
| Math.ceil(x) | smallest integer >= x (double) | Math.ceil(2.1) = 3.0 |
| Math.rint(x) | nearest, ties to even | Math.rint(2.5) = 2.0 |
| Math.random() | double in [0.0, 1.0) | (int)(Math.random() * 6) + 1 = dice |
| Math.floorDiv(a, b) / Math.floorMod(a, b) | division / modulo rounding down | Math.floorMod(-7, 3) = 2 (but -7 % 3 = -1) |
| Math.hypot(x, y) | sqrt(x*x + y*y) | Math.hypot(3, 4) = 5.0 |
| Math.log(x) / Math.log10(x) / Math.exp(x) | ln, log base 10, e^x | Math.log10(1000) = 3.0 |
| Math.sin / cos / tan(rad), Math.toRadians(deg) | trigonometry | Math.sin(Math.toRadians(30)) = 0.5 |
| Math.signum(x) | -1.0, 0.0 or 1.0 | Math.signum(-4.2) = -1.0 |
| Math.addExact / multiplyExact(a, b) | throws ArithmeticException on overflow | safe money/counter maths |
| Math.PI, Math.E | constants | 3.14159..., 2.71828... |
```java
int a = 17, b = 5;
System.out.println(a / b);              // 3   (integer division truncates toward zero)
System.out.println(a % b);              // 2
System.out.println((double) a / b);     // 3.4
System.out.println(-17 / 5 + " " + -17 % 5);                       // -3 -2
System.out.println(Math.floorDiv(-17, 5) + " " + Math.floorMod(-17, 5));   // -4 3
long big = Math.multiplyExact(100_000L, 100_000L);                // 10000000000
int dice = java.util.concurrent.ThreadLocalRandom.current().nextInt(1, 7);   // 1..6
```
### Rounding decimals to N places
```java
double price = 1234.56789;
// 1. Math.round trick (returns double, fine for display, not for money)
double r2 = Math.round(price * 100.0) / 100.0;                 // 1234.57
// 2. String.format / printf  (rounds HALF_UP for display)
String s = String.format("%.2f", price);                        // "1234.57"
System.out.printf("%.3f%n", price);                             // 1234.568
System.out.printf("%,.2f%n", price);                            // 1,234.57 (grouping)
System.out.printf("%08.2f | %-10s | %5d%n", 3.14159, "left", 42);   // 00003.14 | left       |    42
// 3. DecimalFormat (patterns)
java.text.DecimalFormat df = new java.text.DecimalFormat("#,##0.00");
System.out.println(df.format(price));                           // 1,234.57
System.out.println(new java.text.DecimalFormat("0.#").format(2.0));   // 2 (optional digits)
// 4. BigDecimal - exact decimal maths: ALWAYS use for money
java.math.BigDecimal amt = new java.math.BigDecimal("1234.56789");   // use the String constructor!
java.math.BigDecimal rounded = amt.setScale(2, java.math.RoundingMode.HALF_UP);   // 1234.57
java.math.BigDecimal total = new java.math.BigDecimal("0.1").add(new java.math.BigDecimal("0.2"));   // 0.3 exactly
System.out.println(0.1 + 0.2);                                   // 0.30000000000000004  (double is binary!)
java.math.BigDecimal share = new java.math.BigDecimal("100").divide(new java.math.BigDecimal("3"), 2, java.math.RoundingMode.HALF_EVEN);   // 33.33
// 5. Currency formatting for India
java.text.NumberFormat inr = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("en", "IN"));
System.out.println(inr.format(1234567.891));                     // Rs 12,34,567.89
```
| RoundingMode | 2.5 | 3.5 | -2.5 | Use |
|---|---|---|---|---|
| HALF_UP | 3 | 4 | -3 | school rounding, invoices |
| HALF_DOWN | 2 | 3 | -2 | rare |
| HALF_EVEN (banker's) | 2 | 4 | -2 | finance, reduces bias |
| UP | 3 | 4 | -3 | away from zero |
| DOWN | 2 | 3 | -2 | truncate toward zero |
| CEILING | 3 | 4 | -2 | toward +infinity |
| FLOOR | 2 | 3 | -3 | toward -infinity |
> Never use float/double for money: 0.1 cannot be stored exactly in binary. Use BigDecimal (with String constructor) or store paise in a long.
### BigInteger - numbers of any size
```java
java.math.BigInteger f = java.math.BigInteger.ONE;
for (int i = 2; i <= 50; i++) f = f.multiply(java.math.BigInteger.valueOf(i));   // 50! exactly
java.math.BigInteger m = new java.math.BigInteger("123456789123456789").modPow(java.math.BigInteger.TWO, java.math.BigInteger.valueOf(1_000_000_007));
System.out.println(f.bitLength() + " " + m + " " + java.math.BigInteger.valueOf(97).isProbablePrime(20));
```
### Wrapper classes and Character helpers
```java
int n = Integer.parseInt("42");          double d = Double.parseDouble("3.5");
Integer boxed = Integer.valueOf(42);     int back = boxed;                  // auto-unboxing (NPE if boxed is null!)
Integer.MAX_VALUE; Integer.MIN_VALUE; Long.MAX_VALUE; Double.MAX_VALUE;
Integer.toBinaryString(10);              // "1010"
Integer.toHexString(255);                // "ff"
Integer.parseInt("1010", 2);             // 10 (from binary)
Integer.bitCount(7);                     // 3 set bits
Integer.compare(3, 5);                   // -1
Character.isDigit('7'); Character.isLetter('a'); Character.isLetterOrDigit('_');
Character.isUpperCase('A'); Character.toLowerCase('A'); Character.isWhitespace(' ');
int digit = '7' - '0';                   // 7 ; char c = (char) ('a' + 2) -> 'c'
```
### Type casting rules
@chain byte -> short -> int -> long -> float -> double :: Widening (automatic, safe). Reverse direction = narrowing, needs an explicit cast and may lose data
```java
int i = 300;  byte bt = (byte) i;        // 44 (overflow wraps: 300 - 256)
double dd = 9.99; int t = (int) dd;      // 9 (truncates, does not round)
long l = 10; float fl = l;               // widening allowed
char ch = 65; System.out.println(ch);    // A
System.out.println('a' + 1);             // 98 (char promoted to int)
System.out.println("" + 'a' + 1);        // a1 (string concatenation)
byte x = 10, y = 20; int z = x + y;      // byte + byte is int: byte z2 = x + y does NOT compile
```
## String Methods Every Interview Uses
| Method | Example | Result |
|---|---|---|
| length() | "java".length() | 4 |
| charAt(i) | "java".charAt(1) | 'a' |
| substring(b, e) | "javascript".substring(0, 4) | "java" |
| indexOf / lastIndexOf | "banana".indexOf("an") | 1 |
| contains / startsWith / endsWith | "hello".contains("ell") | true |
| equals / equalsIgnoreCase / compareTo | "a".compareTo("b") | -1 |
| toUpperCase / toLowerCase | "Hi".toUpperCase() | "HI" |
| trim() / strip() / isBlank() / isEmpty() | "  x ".strip() | "x" |
| replace / replaceAll(regex) | "a-b-c".replace("-", "") | "abc" |
| split(regex) | "a,b,c".split(",") | [a, b, c] |
| join | String.join("/", "a", "b") | "a/b" |
| toCharArray() / chars() | "abc".toCharArray() | ['a','b','c'] |
| repeat(n) | "ab".repeat(3) | "ababab" |
| valueOf | String.valueOf(3.5) | "3.5" |
| format / formatted | "%d%%".formatted(50) | "50%" |
| matches(regex) | "12345".matches("\\d+") | true |
| intern() | new String("a").intern() == "a" | true |
```java
// reverse, palindrome, count characters, anagram - the classic four
String str = "Madam";
String rev = new StringBuilder(str).reverse().toString();
boolean pal = str.equalsIgnoreCase(rev);
int[] freq = new int[26]; for (char c : str.toLowerCase().toCharArray()) freq[c - 'a']++;
char[] a1 = "listen".toCharArray(), a2 = "silent".toCharArray(); Arrays.sort(a1); Arrays.sort(a2);
boolean anagram = Arrays.equals(a1, a2);
```
## Important Keywords and Concepts
| Keyword | Meaning |
|---|---|
| static | belongs to the class: static fields shared, static methods called without an object, static blocks run once at class load |
| final | variable = constant; method = cannot override; class = cannot extend |
| this / super | current object / parent class members and constructors |
| abstract | class cannot be instantiated; method has no body |
| synchronized | one thread at a time on that monitor |
| volatile | visibility across threads |
| transient | field skipped during serialization |
| instanceof | type check (with pattern matching) |
| native | implemented in C/C++ via JNI |
| strictfp | (legacy) strict floating point |
| var | local type inference |
| record / sealed / permits / yield | modern Java features |
### The Object class methods
- Every class inherits: `equals()`, `hashCode()`, `toString()`, `getClass()`, `clone()`, `finalize()` (deprecated), `wait()`, `notify()`, `notifyAll()` (thread coordination).
### Static vs instance: order of initialisation
```java
class Demo {
    static int counter;                   // 1. static fields + static blocks (once, at class load)
    static { counter = 100; System.out.println("static block"); }
    int id;                               // 2. instance fields + instance blocks (every new)
    { id = ++counter; System.out.println("instance block"); }
    Demo() { System.out.println("constructor, id = " + id); }   // 3. constructor
}
new Demo(); new Demo();   // static block, instance block, constructor id=101, instance block, constructor id=102
```
### Optional - avoid NullPointerException
```java
Optional<String> email = Optional.ofNullable(user.getEmail());
String shown = email.map(String::toLowerCase).filter(e -> e.contains("@")).orElse("not provided");
email.ifPresent(e -> sendWelcome(e));
String must = email.orElseThrow(() -> new IllegalStateException("email required"));
```
### Annotations and reflection
```java
@Override, @Deprecated, @FunctionalInterface, @SuppressWarnings("unchecked")
@Retention(java.lang.annotation.RetentionPolicy.RUNTIME) @interface Audit { String value(); }
class Svc { @Audit("payments") public void pay() {} }
for (var m : Svc.class.getDeclaredMethods())
    if (m.isAnnotationPresent(Audit.class)) System.out.println(m.getName() + " -> " + m.getAnnotation(Audit.class).value());
```
- Frameworks (Spring, Hibernate, JUnit) use reflection + annotations to discover and wire your classes.
## Java Version Features (what interviewers ask)
| Version | Key features |
|---|---|
| 8 | lambdas, streams, Optional, default methods, java.time, CompletableFuture |
| 9 | modules (JPMS), List.of / Map.of, JShell |
| 10 | var |
| 11 (LTS) | HttpClient, String.isBlank / strip / repeat / lines, run single file |
| 14-16 | switch expressions, records, text blocks, pattern matching for instanceof |
| 17 (LTS) | sealed classes, strong encapsulation |
| 21 (LTS) | virtual threads, record patterns, pattern matching in switch, sequenced collections |
| 25 (LTS) | scoped values, compact source files, flexible constructor bodies |
```java
static String describe(Object o) {                 // pattern matching for switch (Java 21)
    return switch (o) {
        case Integer i when i > 100 -> "big int " + i;
        case Integer i -> "int " + i;
        case String s -> "string of length " + s.length();
        case Point(int x, int y) -> "point " + x + "," + y;     // record pattern
        default -> "unknown";
    };
}
```
## Object-Oriented Programming in Java
### Classes, objects, constructors
```java
public class BankAccount {
    private final String owner;              // encapsulated fields
    private double balance;
    private static int count = 0;            // shared by all accounts

    public BankAccount(String owner) { this(owner, 0); }          // constructor chaining
    public BankAccount(String owner, double balance) {
        this.owner = owner; this.balance = balance; count++;
    }
    public void deposit(double amt) {
        if (amt <= 0) throw new IllegalArgumentException("amount must be positive");
        balance += amt;
    }
    public boolean withdraw(double amt) {
        if (amt > balance) return false;
        balance -= amt; return true;
    }
    public double getBalance() { return balance; }
    public static int getCount() { return count; }
    @Override public String toString() { return owner + ": " + balance; }
}
BankAccount acc = new BankAccount("Asha", 1000);
acc.deposit(500); System.out.println(acc);    // Asha: 1500.0
```
- `this` = current object. Static blocks run once when the class loads; instance initialiser blocks run before each constructor.
### Inheritance
- `extends` for classes (single inheritance only), `implements` for interfaces (many allowed). `super` calls the parent constructor/method. `final` class cannot be extended, `final` method cannot be overridden.
@tree Object(Employee(Manager,Engineer),String) :: Every class extends java.lang.Object
```java
class Employee {
    protected String name; protected double salary;
    Employee(String name, double salary) { this.name = name; this.salary = salary; }
    double bonus() { return salary * 0.10; }
}
class Manager extends Employee {
    private int reports;
    Manager(String name, double salary, int reports) { super(name, salary); this.reports = reports; }
    @Override double bonus() { return super.bonus() + reports * 1000; }   // runtime polymorphism
}
Employee e = new Manager("Ravi", 100000, 5);
System.out.println(e.bonus());            // Manager's version: 15000.0
if (e instanceof Manager m) System.out.println(m.reports);   // pattern matching (Java 16)
```
### Polymorphism
- **Compile-time**: method overloading (same name, different parameters).
- **Run-time**: method overriding - the JVM chooses the method by the object's actual class (dynamic dispatch). Fields and static methods are NOT polymorphic.
### Abstraction: abstract classes and interfaces
```java
abstract class Shape {
    abstract double area();                         // no body
    void describe() { System.out.println("Area = " + area()); }   // concrete method
}
interface Drawable { void draw(); default void hint() { System.out.println("drawing"); } static Drawable none() { return () -> {}; } }
interface Resizable { void resize(double factor); }
class Circle extends Shape implements Drawable, Resizable {
    private double r;
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
    public void draw() { System.out.println("()"); }
    public void resize(double f) { r *= f; }
}
```
| Abstract class | Interface |
|---|---|
| can have state (fields) and constructors | only constants (public static final) |
| single inheritance | a class can implement many |
| any access modifiers | methods public (private helpers since 9) |
| use for "is-a" with shared code | use for capabilities ("can-do") |
### Encapsulation, access modifiers and packages
| Modifier | Class | Package | Subclass | World |
|---|---|---|---|---|
| private | yes | no | no | no |
| default (none) | yes | yes | no | no |
| protected | yes | yes | yes | no |
| public | yes | yes | yes | yes |
### equals, hashCode and immutability
- If two objects are `equals`, they **must** have the same `hashCode`, otherwise HashMap/HashSet break.
- Immutable class recipe: final class, private final fields, no setters, defensive copies of mutable fields. **Records** (Java 16) do this automatically.
```java
public record Point(int x, int y) {           // constructor, getters, equals, hashCode, toString generated
    public Point { if (x < 0) throw new IllegalArgumentException(); }   // compact validation
}
final class Money {
    private final long paise;
    Money(long paise) { this.paise = paise; }
    @Override public boolean equals(Object o) { return o instanceof Money m && m.paise == paise; }
    @Override public int hashCode() { return Long.hashCode(paise); }
}
```
### Inner classes, enums, sealed classes
```java
class Outer { class Inner {} static class Nested {} }
Runnable r = new Runnable() { public void run() { System.out.println("anonymous class"); } };
enum Status { ACTIVE("A"), BLOCKED("B"); private final String code; Status(String c) { code = c; } String code() { return code; } }
sealed interface Vehicle permits Car, Bike {}          // Java 17: only listed classes may implement
final class Car implements Vehicle {} final class Bike implements Vehicle {}
```
## Exception Handling
@layers Throwable | Error (OutOfMemory, StackOverflow), Exception | IOException (checked), SQLException (checked), RuntimeException (unchecked) | NullPointer, IllegalArgument, IndexOutOfBounds :: Exception hierarchy
- **Checked** exceptions (IOException, SQLException) must be caught or declared with `throws` - checked at compile time. **Unchecked** (RuntimeException subclasses) are programming bugs. **Error** = JVM problems, do not catch.
```java
try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {   // try-with-resources closes br
    System.out.println(br.readLine());
} catch (FileNotFoundException e) {
    System.out.println("missing file");
} catch (IOException | RuntimeException e) {      // multi-catch
    e.printStackTrace();
} finally {
    System.out.println("always runs");
}
class InsufficientFundsException extends Exception {
    InsufficientFundsException(String msg) { super(msg); }
}
void withdraw(double amt) throws InsufficientFundsException { throw new InsufficientFundsException("low balance"); }
```
## Generics
```java
class Box<T> { private T item; void set(T t) { item = t; } T get() { return item; } }
static <T extends Comparable<T>> T max(List<T> list) { T best = list.get(0); for (T x : list) if (x.compareTo(best) > 0) best = x; return best; }
double sum(List<? extends Number> nums) { double s = 0; for (Number n : nums) s += n.doubleValue(); return s; }   // read (producer)
void fill(List<? super Integer> out) { out.add(1); }                                                            // write (consumer)
```
- **PECS**: Producer Extends, Consumer Super. Generics use **type erasure**: type info is removed at run time (so `new T()` is impossible).
## Collections Framework
@layers Iterable | Collection | List, Set, Queue | ArrayList, LinkedList, HashSet, TreeSet, PriorityQueue, ArrayDeque :: Collection hierarchy (Map is separate: HashMap, LinkedHashMap, TreeMap)
| Class | Structure | get / add / contains | Ordered? |
|---|---|---|---|
| ArrayList | dynamic array | O(1) / O(1)* / O(n) | insertion |
| LinkedList | doubly linked | O(n) / O(1) ends / O(n) | insertion |
| HashSet | hash table | - / O(1) / O(1) | no |
| LinkedHashSet | hash + linked list | - / O(1) / O(1) | insertion |
| TreeSet | red-black tree | - / O(log n) / O(log n) | sorted |
| HashMap | array of buckets (tree bins) | O(1) avg | no |
| TreeMap | red-black tree | O(log n) | sorted keys |
| PriorityQueue | binary heap | offer/poll O(log n), peek O(1) | heap order |
| ArrayDeque | circular array | O(1) both ends | insertion |
```java
List<Integer> list = new ArrayList<>(List.of(5, 3, 8));
list.add(1); list.remove(Integer.valueOf(3)); Collections.sort(list); list.sort(Comparator.reverseOrder());
Map<String, Integer> freq = new HashMap<>();
for (String w : "a b a c a".split(" ")) freq.merge(w, 1, Integer::sum);      // {a=3, b=1, c=1}
freq.getOrDefault("z", 0); freq.putIfAbsent("d", 0); freq.computeIfAbsent("e", k -> 5);
for (Map.Entry<String, Integer> e : freq.entrySet()) System.out.println(e.getKey() + "=" + e.getValue());
TreeMap<Integer, String> tm = new TreeMap<>(); tm.floorKey(5); tm.ceilingKey(5); tm.headMap(5);
Deque<Integer> stack = new ArrayDeque<>(); stack.push(1); stack.pop();
Queue<Integer> q = new ArrayDeque<>(); q.offer(1); q.poll();
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);       // min by second value
Iterator<Integer> it = list.iterator(); while (it.hasNext()) if (it.next() < 0) it.remove();   // safe removal
```
### How HashMap works internally
- An array of **buckets**. index = (hash(key) ^ (hash >>> 16)) & (capacity - 1). Collisions form a linked list; when one bucket has more than 8 entries (and capacity >= 64) it becomes a **red-black tree** (O(log n)).
- Default capacity 16, load factor 0.75: at 12 entries it doubles and rehashes.
- ConcurrentHashMap: thread-safe with fine-grained locking/CAS; Hashtable is legacy and fully synchronized.
@grid 0: _ / 1: (k1,v1) -> (k9,v9) / 2: _ / 3: (k3,v3) :: HashMap buckets with chaining
### Comparable vs Comparator
```java
class Student implements Comparable<Student> {
    String name; int marks;
    Student(String n, int m) { name = n; marks = m; }
    public int compareTo(Student o) { return Integer.compare(marks, o.marks); }   // natural order
}
students.sort(Comparator.comparing((Student s) -> s.marks).reversed().thenComparing(s -> s.name));
```
## Functional Programming: Lambdas and Streams (Java 8+)
- A **functional interface** has one abstract method (Runnable, Comparator, Function<T,R>, Predicate<T>, Consumer<T>, Supplier<T>). A lambda implements it inline.
- **Streams** process collections declaratively: source -> intermediate ops (lazy) -> terminal op.
@chain List -> stream() -> filter -> map -> sorted -> collect :: Stream pipeline (lazy until the terminal op)
```java
List<String> names = List.of("asha", "ravi", "meena", "arun");
List<String> result = names.stream()
    .filter(n -> n.startsWith("a"))
    .map(String::toUpperCase)                 // method reference
    .sorted()
    .collect(Collectors.toList());            // [ARUN, ASHA]
int total = IntStream.rangeClosed(1, 100).sum();
Map<Integer, List<String>> byLen = names.stream().collect(Collectors.groupingBy(String::length));
Map<Boolean, Long> parts = names.stream().collect(Collectors.partitioningBy(n -> n.length() > 4, Collectors.counting()));
Optional<String> first = names.stream().filter(n -> n.contains("z")).findFirst();
String s = first.orElse("none");
double avg = employees.stream().mapToDouble(e -> e.salary).average().orElse(0);
List<Integer> flat = Stream.of(List.of(1, 2), List.of(3)).flatMap(List::stream).toList();
long cnt = names.parallelStream().filter(n -> n.length() > 3).count();   // parallel for big CPU work
```
## Multithreading and Concurrency
### Creating threads
```java
class Worker extends Thread { public void run() { System.out.println("worker"); } }
new Worker().start();                                       // start() creates a new thread, run() would not
Thread t = new Thread(() -> System.out.println("lambda thread")); t.start(); t.join();
ExecutorService pool = Executors.newFixedThreadPool(4);     // reuse threads
Future<Integer> f = pool.submit(() -> 6 * 7);
System.out.println(f.get()); pool.shutdown();
CompletableFuture.supplyAsync(() -> fetchUser())
    .thenApply(u -> u.name).thenAccept(System.out::println).join();
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {   // Java 21 virtual threads: millions of cheap threads
    for (int i = 0; i < 10_000; i++) ex.submit(() -> Thread.sleep(1000));
}
```
@chain NEW -> RUNNABLE -> RUNNING -> BLOCKED / WAITING / TIMED_WAITING -> TERMINATED :: Thread life cycle
### Synchronisation
```java
class Counter {
    private int count = 0;
    public synchronized void inc() { count++; }             // one thread at a time per object
    public int get() { return count; }
}
AtomicInteger ai = new AtomicInteger(); ai.incrementAndGet();   // lock-free CAS
ReentrantLock lock = new ReentrantLock();
lock.lock(); try { /* critical section */ } finally { lock.unlock(); }
private volatile boolean running = true;                     // visibility across threads, not atomicity
```
### Producer-consumer with BlockingQueue
```java
BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);
Thread producer = new Thread(() -> { for (int i = 0; i < 100; i++) { try { queue.put(i); } catch (InterruptedException e) { return; } } });
Thread consumer = new Thread(() -> { while (true) { try { System.out.println(queue.take()); } catch (InterruptedException e) { return; } } });
producer.start(); consumer.start();
```
- Deadlock needs: mutual exclusion, hold and wait, no preemption, circular wait. Prevent by ordering locks or using tryLock with timeout.
- Other tools: CountDownLatch, CyclicBarrier, Semaphore, ConcurrentHashMap, CopyOnWriteArrayList.
## JVM Internals and Memory
@layers JVM memory | Heap (Young: Eden + Survivor, Old gen), Metaspace (class metadata), Stacks (one per thread), PC registers :: JVM runtime areas
- **Stack**: method frames, local primitives and references; one per thread; StackOverflowError on deep recursion.
- **Heap**: all objects; shared; managed by the **garbage collector**. Objects are born in Eden; survivors move to Survivor spaces then the Old generation (generational hypothesis: most objects die young).
- GCs: Serial, Parallel, **G1** (default, region-based), **ZGC** / Shenandoah (sub-millisecond pauses). An object is collectable when it is unreachable from GC roots.
- Class loading: Bootstrap -> Platform -> Application class loader (parent delegation).
- Tuning flags: `-Xms512m -Xmx2g -XX:+UseG1GC`. Tools: jconsole, VisualVM, jstack (thread dump), jmap (heap dump).
## File I/O, Serialization and Date-Time
```java
Path p = Path.of("notes.txt");
Files.writeString(p, "hello\nworld");
List<String> lines = Files.readAllLines(p);
try (Stream<String> st = Files.lines(p)) { st.filter(l -> !l.isBlank()).forEach(System.out::println); }
LocalDate today = LocalDate.now(); LocalDateTime now = LocalDateTime.now();
Duration d = Duration.ofMinutes(90); today.plusDays(7).getDayOfWeek();
DateTimeFormatter.ofPattern("dd-MM-yyyy").format(today);
```
## File Handling in Java (complete)
| Class | Use |
|---|---|
| File / Path / Files | information about files and folders; create, delete, copy, list |
| FileReader / FileWriter | read / write characters |
| BufferedReader / BufferedWriter | fast line-by-line text (wraps a reader / writer) |
| Scanner | easy parsing of tokens and lines |
| PrintWriter | print / println / printf into a file |
| FileInputStream / FileOutputStream | raw bytes (images, PDFs) |
| BufferedInputStream / BufferedOutputStream | fast byte streams |
| ObjectInputStream / ObjectOutputStream | serialization of objects |
| RandomAccessFile | jump to any position (seek) |
@chain Your program -> BufferedWriter (memory buffer) -> FileWriter (characters to bytes) -> File on disk :: Streams are wrapped like layers
@flow (Open the file inside try-with-resources) | Read or write in a loop | <IOException? ~ catch block handles the error> | (Stream closes automatically) :: File handling steps
```java
import java.io.*;
import java.nio.file.*;
import java.util.*;

public class FileDemo {
    public static void main(String[] args) throws IOException {
        // 1. Create a file and a folder
        File f = new File("notes.txt");
        if (f.createNewFile()) System.out.println("created " + f.getName());
        new File("data/reports").mkdirs();
        System.out.println(f.exists() + " " + f.length() + " " + f.getAbsolutePath() + " " + f.canWrite());

        // 2. Write text (overwrite), then append (second argument true)
        try (BufferedWriter bw = new BufferedWriter(new FileWriter("notes.txt"))) {
            bw.write("Asha,91"); bw.newLine();
            bw.write("Ravi,78"); bw.newLine();
        }
        try (PrintWriter pw = new PrintWriter(new FileWriter("notes.txt", true))) {
            pw.printf("%s,%d%n", "Meena", 85);
        }

        // 3. Read line by line
        try (BufferedReader br = new BufferedReader(new FileReader("notes.txt"))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                System.out.println(parts[0] + " scored " + Integer.parseInt(parts[1]));
            }
        }

        // 4. Read with Scanner (word by word / number by number)
        try (Scanner sc = new Scanner(new File("notes.txt"))) {
            while (sc.hasNextLine()) System.out.println(sc.nextLine());
        }

        // 5. Modern NIO: the short way
        Path p = Path.of("notes.txt");
        List<String> lines = Files.readAllLines(p);                     // whole file as a list
        String all = Files.readString(p);                               // whole file as one String
        Files.writeString(Path.of("copy.txt"), all);                    // write
        Files.write(p, List.of("John,66"), StandardOpenOption.APPEND);  // append lines
        try (var stream = Files.lines(p)) {                             // lazy: good for huge files
            long passed = stream.filter(l -> Integer.parseInt(l.split(",")[1]) >= 75).count();
            System.out.println(passed + " passed");
        }
        Files.copy(p, Path.of("backup.txt"), StandardCopyOption.REPLACE_EXISTING);
        Files.move(Path.of("backup.txt"), Path.of("data/backup.txt"), StandardCopyOption.REPLACE_EXISTING);
        Files.deleteIfExists(Path.of("copy.txt"));
        try (var dir = Files.list(Path.of("."))) { dir.forEach(System.out::println); }   // list a folder
        try (var walk = Files.walk(Path.of("data"))) { walk.filter(Files::isRegularFile).forEach(System.out::println); }

        // 6. Bytes: copy an image
        try (InputStream in = new BufferedInputStream(new FileInputStream("photo.jpg"));
             OutputStream out = new BufferedOutputStream(new FileOutputStream("photo-copy.jpg"))) {
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        } catch (FileNotFoundException e) { System.out.println("photo.jpg not found"); }

        // 7. Random access
        try (RandomAccessFile raf = new RandomAccessFile("notes.txt", "rw")) {
            raf.seek(raf.length()); raf.writeBytes("Zoya,99\n");        // jump to the end and write
        }
    }
}
```
| Character streams (Reader / Writer) | Byte streams (InputStream / OutputStream) |
|---|---|
| text: .txt, .csv, .json | binary: images, audio, .pdf, .zip |
| handle character encoding (UTF-8) | raw 8-bit bytes |
| FileReader, BufferedReader, FileWriter | FileInputStream, FileOutputStream |
- Always close streams: **try-with-resources** does it for you, even when an exception is thrown.
- Buffered streams collect data in memory and touch the disk fewer times, so they are much faster.
- Common exceptions: FileNotFoundException, IOException, NoSuchFileException, AccessDeniedException, EOFException.
## Serialization in Java (saving objects to a file)
- **Serialization** = converting an object into a stream of bytes so it can be saved in a file or sent over a network. **Deserialization** = rebuilding the object from those bytes.
- The class must implement the marker interface `java.io.Serializable` (no methods). Every field must also be serializable, or be marked `transient` (skipped), or be `static` (belongs to the class, not saved).
@chain Object in memory -> ObjectOutputStream.writeObject -> bytes in student.ser -> ObjectInputStream.readObject -> Object again :: Serialization and deserialization
```java
import java.io.*;
import java.util.*;

class Address implements Serializable {
    private static final long serialVersionUID = 1L;
    String city;
    Address(String city) { this.city = city; }
}
class Student implements Serializable {
    private static final long serialVersionUID = 1L;   // version stamp: must match when reading back
    String name; int marks;
    Address address;                                   // must be Serializable too
    transient String password;                         // NOT saved: comes back as null
    static String school = "VIT";                      // static fields are not part of the object
    Student(String n, int m, Address a, String p) { name = n; marks = m; address = a; password = p; }
}
public class SerializeDemo {
    public static void main(String[] args) throws Exception {
        List<Student> list = new ArrayList<>(List.of(new Student("Asha", 91, new Address("Pune"), "secret")));
        try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("students.ser"))) {
            out.writeObject(list);                     // the whole object graph is saved
        }
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream("students.ser"))) {
            @SuppressWarnings("unchecked") List<Student> back = (List<Student>) in.readObject();
            Student s = back.get(0);
            System.out.println(s.name + " " + s.marks + " " + s.address.city + " " + s.password);   // Asha 91 Pune null
        }
    }
}
```
| Topic | Explanation |
|---|---|
| serialVersionUID | a version number for the class. If the class changes and the number differs, reading old data throws InvalidClassException. Always declare it. |
| transient | skip this field (passwords, caches, open connections) |
| static fields | never serialized |
| inheritance | if the parent is Serializable the child is too. If only the child is, the parent's no-arg constructor runs on read and its fields are reset. |
| NotSerializableException | thrown when a field's class is not Serializable |
| custom control | private writeObject / readObject methods, or implement Externalizable (writeExternal / readExternal) for full control |
| readResolve() | keeps a singleton single after deserialization |
| security | never deserialize data from untrusted sources (it can run attacker code). Prefer JSON. |
```java
// Custom serialization: encrypt or transform a field yourself
class Card implements Serializable {
    private static final long serialVersionUID = 1L;
    transient String number;
    private void writeObject(ObjectOutputStream out) throws IOException {
        out.defaultWriteObject();
        out.writeObject(new StringBuilder(number).reverse().toString());   // stand-in for real encryption
    }
    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject();
        number = new StringBuilder((String) in.readObject()).reverse().toString();
    }
}
// JSON is the usual choice today (Jackson library)
// ObjectMapper mapper = new ObjectMapper();
// mapper.writeValue(new File("student.json"), student);            // object -> JSON file
// Student s = mapper.readValue(new File("student.json"), Student.class);
```
## JDBC - Talking to a Database
```java
String url = "jdbc:postgresql://localhost:5432/shop";
try (Connection con = DriverManager.getConnection(url, "app", System.getenv("DB_PASS"));
     PreparedStatement ps = con.prepareStatement("SELECT id, name FROM users WHERE city = ?")) {
    ps.setString(1, "Pune");                  // PreparedStatement prevents SQL injection
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) System.out.println(rs.getInt("id") + " " + rs.getString("name"));
    }
    con.setAutoCommit(false);                 // transaction
    try (PreparedStatement t = con.prepareStatement("UPDATE accounts SET bal = bal - ? WHERE id = ?")) {
        t.setDouble(1, 100); t.setInt(2, 1); t.executeUpdate(); con.commit();
    } catch (SQLException e) { con.rollback(); }
}
```
## Build Tools and Testing
- **Maven** (pom.xml) / **Gradle** (build.gradle): dependencies, build, test, package (jar/war). Standard layout: src/main/java, src/test/java.
```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
class BankAccountTest {
    BankAccount acc;
    @BeforeEach void setUp() { acc = new BankAccount("T", 100); }
    @Test void depositAddsMoney() { acc.deposit(50); assertEquals(150, acc.getBalance()); }
    @Test void negativeDepositFails() { assertThrows(IllegalArgumentException.class, () -> acc.deposit(-1)); }
}
// Mockito: UserRepo repo = mock(UserRepo.class); when(repo.find(1)).thenReturn(user); verify(repo).save(any());
```
## Spring Boot - Building REST APIs
@layers Client | Controller (@RestController), Service (@Service: business logic), Repository (@Repository: JPA), Database :: Layered Spring Boot app
- **Spring** = dependency injection container + modules. **Inversion of Control**: the framework creates objects (beans) and injects dependencies, so classes do not `new` their collaborators.
- **Spring Boot**: auto-configuration + embedded Tomcat + starters -> a production app from `main()`.
```java
@SpringBootApplication
public class ShopApplication { public static void main(String[] args) { SpringApplication.run(ShopApplication.class, args); } }

@Entity @Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank private String name;
    @Positive private double price;
    // getters / setters
}
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String q);     // query derived from the method name
}
@Service
public class ProductService {
    private final ProductRepository repo;
    public ProductService(ProductRepository repo) { this.repo = repo; }   // constructor injection
    public Product create(Product p) { return repo.save(p); }
    public Product get(Long id) { return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); }
}
@RestController @RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService s) { service = s; }
    @GetMapping("/{id}") public Product get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody Product p) { return service.create(p); }
}
```
```txt
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/shop
spring.datasource.username=app
spring.jpa.hibernate.ddl-auto=validate
server.port=8080
```
- Other essentials: Spring Security (JWT/OAuth2), Spring Data JPA/Hibernate (entities, relationships @OneToMany, lazy loading, N+1 problem), profiles (dev/prod), Actuator (health/metrics), @Transactional, Spring Cloud for microservices.
## Java Interview Questions
Q: Why is Java platform independent?
A: It compiles to bytecode that runs on any JVM; only the JVM is platform specific.
Q: JDK vs JRE vs JVM?
A: JVM executes bytecode; JRE = JVM + libraries to run programs; JDK = JRE + compiler and tools to develop.
Q: Is Java pass-by-value or pass-by-reference?
A: Always pass-by-value; for objects the value copied is the reference.
Q: == vs equals()?
A: == compares references (or primitive values); equals compares logical content when overridden.
Q: Why must hashCode be overridden with equals?
A: Hash collections find the bucket by hashCode first; equal objects with different hash codes would never be found.
Q: Why is String immutable?
A: Security (class names, URLs), thread safety, caching of hashCode, and the string pool sharing.
Q: Abstract class vs interface?
A: Abstract classes can hold state and constructors with single inheritance; interfaces define capabilities, support multiple inheritance, and can have default/static methods.
Q: HashMap vs ConcurrentHashMap vs Hashtable?
A: HashMap is not thread-safe and allows one null key; ConcurrentHashMap is thread-safe with fine-grained locking and no nulls; Hashtable is legacy, fully synchronized.
Q: ArrayList vs LinkedList?
A: ArrayList has O(1) random access and is cache-friendly; LinkedList has O(1) insert/remove at ends but O(n) access. ArrayList is almost always faster.
Q: final vs finally vs finalize?
A: final = constant/non-overridable/non-extendable; finally = block that always runs after try; finalize = deprecated GC hook.
Q: Checked vs unchecked exceptions?
A: Checked must be handled or declared (compile-time); unchecked are RuntimeExceptions for programming errors.
Q: What is the volatile keyword?
A: It guarantees visibility of writes across threads and prevents reordering, but does not make compound operations atomic.
Q: synchronized method vs block?
A: A method locks the whole object (or class for static); a block locks only the chosen object for the critical lines - finer and faster.
Q: What are the SOLID principles?
A: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion (explained with code in notebook 04).
Q: How does garbage collection decide what to free?
A: Objects not reachable from GC roots (stack references, static fields, active threads) are garbage; generational collectors clean the young generation often and the old generation rarely.
Q: What is a memory leak in Java?
A: Objects that are still referenced but never used (static collections, listeners, caches without eviction) so GC cannot free them.
Q: Explain Spring dependency injection and bean scopes.
A: The container creates beans and injects dependencies through constructors/setters; scopes include singleton (default), prototype, request and session.
Q: How do you round a double to 2 decimal places?
A: For display use String.format("%.2f", x) or DecimalFormat; for exact money arithmetic use new BigDecimal("x").setScale(2, RoundingMode.HALF_UP).
Q: What does Math.round(-2.5) return and why?
A: -2, because Math.round adds 0.5 and takes the floor (rounds half toward positive infinity).
Q: Why is 0.1 + 0.2 not equal to 0.3 in Java?
A: double stores binary fractions; 0.1 has no exact binary representation, so tiny errors appear. Use BigDecimal for exact decimals.
Q: Difference between Math.floor, Math.ceil, Math.round and casting to int?
A: floor rounds down, ceil rounds up (both return double), round goes to the nearest (half up) and returns long/int, a cast truncates toward zero.
Q: What is the order of execution of static block, instance block and constructor?
A: Static blocks once when the class loads; then for each object: instance initialiser blocks followed by the constructor body.
Q: What happens on integer overflow?
A: It silently wraps around (Integer.MAX_VALUE + 1 = Integer.MIN_VALUE); use long, Math.addExact (throws) or BigInteger.
