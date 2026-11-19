# C++ - From Zero to Advanced OOP and Modern C++
This notebook starts from "what is a program" and goes up to templates, smart pointers, move semantics, the STL, concurrency and interview questions. Type every example and run it - that is how you learn a language.
## Getting Started
### What is C++
- C++ (1985, Bjarne Stroustrup) = C + classes + generic programming. It is **compiled** to machine code, so it is very fast, and gives direct control of memory.
- Used in: game engines, browsers (Chrome), databases (MySQL), trading systems, operating systems, embedded devices, competitive programming.
- Versions: C++98, C++11 (big modern update: auto, lambdas, smart pointers, move), C++14, C++17, C++20 (concepts, ranges, coroutines), C++23.
### How a C++ program becomes an executable
@chain main.cpp -> Preprocessor (#include, #define) -> Compiler (to assembly / object file) -> Linker (joins .o files + libraries) -> a.out / app.exe :: Build pipeline
```sh
g++ -std=c++17 -O2 -Wall main.cpp -o main     # compile with warnings and optimisation
./main                                         # run
g++ -g main.cpp -o main && gdb ./main          # debug build + debugger
```

### What is a Header File (.h / .hpp) vs Implementation (.cpp)?
- **The Restaurant Analogy (Menu vs Kitchen Recipe):**
  - Imagine walking into a fine dining restaurant. The waiter hands you a printed **Menu**. The menu tells you the name of each dish, what inputs it takes (e.g. choice of dressing), and what dish you will receive. It does **not** explain how the chef cuts the onions, boils the stock, or seasons the pan in the kitchen.
  - A **Header File (`math.h` / `math.hpp`)** is that **Restaurant Menu**. It declares what functions, classes, and types exist (declarations: `int add(int a, int b);`) so other files know how to talk to them.
  - A **Source / Implementation File (`math.cpp`)** is the **Private Kitchen Recipe**. It contains the actual cooking logic (definitions: `int add(int a, int b) { return a + b; }`).
  - When your `main.cpp` writes `#include "math.hpp"`, the C++ **Preprocessor** acts as a literal copy-paste robot: it copies the menu text into `main.cpp` before the compiler runs.
  - The **Compiler** verifies that your orders match the menu (types, argument counts). Later, the **Linker** connects your call to the compiled kitchen binary (`math.o`).

### Header Files vs Java Imports & Packages
- In **C++**, `#include` is a blind text paste of the header file before compiling. If you include the same header twice without `#pragma once` or `#ifndef` header guards, you get "redefinition" errors.
- In **Java**, there are **NO header files**. Java compiles directly to `.class` bytecode containing both signature and code. An `import java.util.ArrayList;` is simply a **speed-dial / phonebook entry**: it tells the compiler "when I type `ArrayList`, I mean `java.util.ArrayList` so I don't have to type the full postal address every time."
- In **Python**, `import math` loads a module object into memory at runtime and creates a namespace reference.

### First program
```cpp
#include <iostream>          // brings in cin / cout
using namespace std;         // lets us write cout instead of std::cout

int main() {                 // execution starts here
    cout << "Hello, World!" << endl;
    return 0;                // 0 = success to the operating system
}
```
## Variables, Data Types and Operators
### Data types
| Type | Size (typical) | Range / example |
|---|---|---|
| bool | 1 byte | true / false |
| char | 1 byte | 'A' (ASCII 65) |
| int | 4 bytes | about -2.1e9 to 2.1e9 |
| long long | 8 bytes | about -9.2e18 to 9.2e18 |
| float | 4 bytes | 7 significant digits |
| double | 8 bytes | 15 significant digits |
| unsigned int | 4 bytes | 0 to 4.29e9 |
| size_t | 8 bytes | sizes and indices |
```cpp
int age = 21;                  // declaration + initialisation
double pi = 3.14159;
char grade = 'A';
bool passed = true;
auto x = 10LL;                 // auto deduces long long
const int MAX = 100;           // cannot change
constexpr int SQ = 5 * 5;      // computed at compile time
int a{5};                      // brace initialisation (prevents narrowing)
cout << sizeof(int) << " " << sizeof(long long) << "\n";   // 4 8
```
> Integer overflow is undefined behaviour: `int x = 2e9; x = x * 2;` is wrong. Use `long long` for big sums and products.
### Operators
| Kind | Operators |
|---|---|
| arithmetic | + - * / % (integer / truncates: 7 / 2 = 3) |
| relational | == != < > <= >= |
| logical | && (and), double bar (or), ! (not) |
| bitwise | & , xor ^, ~, <<, >> |
| assignment | = += -= *= /= %= |
| increment | ++i (pre), i++ (post) |
| ternary | cond ? a : b |
### Type conversion
```cpp
int a = 7, b = 2;
double d = (double)a / b;          // 3.5 (C-style cast)
double e = static_cast<double>(a) / b;   // preferred C++ cast
int f = 3.99;                      // implicit: 3 (truncation)
string s = to_string(42); int n = stoi("123"); double g = stod("2.5");
```
## Input and Output
```cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);   // fast I/O for big inputs
    int n; string name;
    cin >> n >> name;                 // reads words separated by spaces
    string line; getline(cin >> ws, line);   // reads a whole line
    cout << "n = " << n << ", name = " << name << "\n";
    cout << fixed << setprecision(2) << 3.14159 << "\n";   // 3.14
    printf("%d %.3f\n", n, 2.5);      // C-style output still works
}
```
## Header Files - What to Include for What
- A **header** declares functions and classes that live in a library. `#include <name>` pastes those declarations so the compiler knows them. Standard headers have no `.h`; C headers have a `c` prefix (`<cmath>` is C's `math.h`).
| Header | Gives you |
|---|---|
| <iostream> | cin, cout, cerr, endl |
| <iomanip> | setw, setprecision, fixed, setfill, left, right, hex |
| <fstream> | ifstream, ofstream, fstream (files) |
| <sstream> | stringstream, istringstream, ostringstream |
| <string> | std::string, to_string, stoi, stod, getline |
| <cstring> | C strings: strlen, strcpy, strcmp, memset, memcpy |
| <cctype> | isdigit, isalpha, isalnum, isspace, toupper, tolower |
| <cmath> | sqrt, pow, abs, floor, ceil, round, log, sin, cos |
| <cstdlib> | abs, rand, srand, atoi, exit, malloc, free |
| <climits> / <cfloat> | INT_MAX, INT_MIN, LLONG_MAX / DBL_MAX |
| <limits> | numeric_limits<int>::max() |
| <algorithm> | sort, reverse, max, min, find, binary_search, lower_bound, next_permutation, unique |
| <numeric> | accumulate, iota, gcd, lcm, partial_sum |
| <vector> <array> <deque> <list> | sequence containers |
| <stack> <queue> | stack, queue, priority_queue |
| <set> <map> | set, multiset, map, multimap (sorted) |
| <unordered_set> <unordered_map> | hash containers |
| <utility> / <tuple> | pair, make_pair, swap, move / tuple, tie |
| <functional> | function, greater, less, hash, bind |
| <memory> | unique_ptr, shared_ptr, weak_ptr, make_unique, make_shared |
| <bitset> | fixed-size bit arrays |
| <chrono> / <thread> / <mutex> | time, threads, locks |
| <random> | mt19937, uniform_int_distribution |
| <stdexcept> / <exception> | runtime_error, invalid_argument, out_of_range |
| <cassert> | assert(condition) |
| <optional> <variant> <string_view> | C++17 vocabulary types |
| <format> / <print> | C++20 std::format / C++23 std::print |
| <bits/stdc++.h> | GCC-only shortcut that includes everything (contests only, not in real projects) |
## Output Formatting (Formatters)
### iostream manipulators
```cpp
#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    double pi = 3.14159265;
    cout << pi << "\n";                                   // 3.14159 (default: 6 significant digits)
    cout << fixed << setprecision(2) << pi << "\n";       // 3.14   (fixed = digits after the point)
    cout << scientific << pi << "\n";                     // 3.14e+00
    cout << defaultfloat;                                 // back to normal
    cout << setw(8) << 42 << "|\n";                       //       42|   (width 8, right aligned)
    cout << left << setw(8) << 42 << "|\n";               // 42      |
    cout << right << setfill('0') << setw(5) << 42 << "\n";   // 00042
    cout << setfill(' ');
    cout << hex << 255 << " " << oct << 8 << " " << dec << 10 << "\n";   // ff 10 10
    cout << showbase << hex << 255 << noshowbase << dec << "\n";         // 0xff
    cout << boolalpha << true << noboolalpha << "\n";     // true
    cout << showpos << 5 << noshowpos << "\n";            // +5
    cout << "a\tb\nnew line \"quoted\" back\\slash\n";    // escape sequences: tab, newline, quote, backslash
}
```
| Manipulator | Effect | Sticky? |
|---|---|---|
| setw(n) | minimum width for the NEXT item only | no |
| setprecision(n) | digits (after the point when used with fixed) | yes |
| fixed / scientific | number style | yes |
| left / right / internal | alignment | yes |
| setfill(c) | padding character | yes |
| endl | newline + flush (slower than "\n") | - |
### printf / scanf format specifiers
```cpp
#include <cstdio>
printf("%d %5d %-5d| %05d\n", 42, 42, 42, 42);     // 42    42 42   | 00042
printf("%lld %u %x %o\n", 9000000000LL, 7u, 255, 8); // 9000000000 7 ff 10
printf("%f %.2f %10.3f %e\n", 3.14159, 3.14159, 3.14159, 3.14159);
printf("%c %s %10s %-10s|\n", 'A', "hi", "right", "left");
printf("%p %%\n", (void*)&main);                    // pointer address, literal %
int a; double d; char name[20];
scanf("%d %lf %19s", &a, &d, name);                 // & gives the address to store into
```
| Specifier | Type |
|---|---|
| %d / %i | int |
| %ld / %lld | long / long long |
| %u | unsigned int |
| %f / %lf | float or double in printf / double in scanf |
| %.2f | 2 digits after the decimal point |
| %c / %s | char / C string |
| %x / %o | hexadecimal / octal |
| %e | scientific |
| %5d / %-5d / %05d | width 5 right / left / zero padded |
### std::format (C++20) and std::print (C++23)
```cpp
#include <format>
string s = format("{} scored {:.1f}% in {}", "Asha", 91.456, "maths");   // Asha scored 91.5% in maths
string t = format("{:>8}|{:<8}|{:^8}|", "r", "l", "mid");                // right, left, centre in width 8
string u = format("{:05d} {:x} {:b} {:,}", 42, 255, 5, 0);               // 00042 ff 101
// std::print("{} + {} = {}\n", 2, 3, 2 + 3);                            // C++23 <print>
```
## Built-in Math Functions (<cmath>, <cstdlib>, <numeric>)
| Function | Result | Example |
|---|---|---|
| abs(x) / fabs(x) | absolute value (int / double) | abs(-5) = 5 |
| pow(a, b) | a to the power b (double) | pow(2, 10) = 1024 |
| sqrt(x) / cbrt(x) | square root / cube root | sqrt(49) = 7 |
| floor(x) | round down | floor(2.9) = 2, floor(-2.1) = -3 |
| ceil(x) | round up | ceil(2.1) = 3 |
| round(x) | nearest, halves away from zero | round(2.5) = 3, round(-2.5) = -3 |
| trunc(x) | drop the fraction | trunc(-2.9) = -2 |
| fmod(a, b) | remainder for doubles | fmod(7.5, 2) = 1.5 |
| exp(x) / log(x) / log2(x) / log10(x) | e^x, natural log, log base 2, log base 10 | log2(8) = 3 |
| sin, cos, tan, asin, acos, atan, atan2(y, x) | trigonometry in radians | sin(M_PI / 2) = 1 |
| hypot(a, b) | sqrt(a*a + b*b) | hypot(3, 4) = 5 |
| max(a, b) / min(a, b) | larger / smaller (<algorithm>) | max({3, 9, 4}) = 9 |
| swap(a, b) | exchange values | - |
| gcd(a, b) / lcm(a, b) | <numeric>, C++17 | gcd(12, 18) = 6 |
| __gcd(a, b) | GCC built-in gcd | - |
| rand() % n / srand(time(0)) | simple random numbers | prefer <random> |
| isnan(x) / isinf(x) | check special floating values | - |
```cpp
#include <cmath>
#include <numeric>
#include <random>
double r2 = round(3.14159 * 100) / 100;              // 3.14  (round to 2 decimals)
int digits = (int)log10(12345) + 1;                  // 5
long long p = 1; for (int i = 0; i < 10; i++) p *= 2;   // exact integer power: do NOT use pow for big integers
bool isSquare = ((long long)sqrtl(49) * (long long)sqrtl(49) == 49);
mt19937 rng(random_device{}());                      // good random generator
int dice = uniform_int_distribution<int>(1, 6)(rng);
```
> pow() returns a double, so pow(10, 2) can become 99.9999 and turn into 99 when cast to int. For integers multiply in a loop or use fast exponentiation.
### GCC built-in bit functions
```cpp
__builtin_popcount(13);        // 3   number of 1 bits (use popcountll for long long)
__builtin_clz(1);              // 31  leading zeros in a 32-bit int
__builtin_ctz(8);              // 3   trailing zeros
__builtin_parity(7);           // 1   1 if the count of set bits is odd
bitset<8> b(13); b.count(); b.to_string();   // "00001101"
```
## String Functions (std::string)
| Function | What it does | Example ("hello world") |
|---|---|---|
| s.size() / s.length() | number of characters | 11 |
| s.empty() | true if length is 0 | false |
| s[i] / s.at(i) | character at i (at checks bounds) | s[0] = 'h' |
| s.front() / s.back() | first / last character | 'h' / 'd' |
| s + t / s += t / s.append(t) | join strings | "hello world!" |
| s.push_back(c) / s.pop_back() | add / remove last char | - |
| s.substr(pos, len) | copy a part | s.substr(6, 5) = "world" |
| s.find(t) / s.rfind(t) | first / last index of t, or string::npos | s.find("o") = 4 |
| s.find_first_of("aeiou") | first index of any of these chars | 1 |
| s.insert(pos, t) | insert t at pos | - |
| s.erase(pos, len) | remove len chars from pos | - |
| s.replace(pos, len, t) | replace a part | - |
| s.compare(t) / == < > | compare (0 = equal) | - |
| s.clear() | make empty | - |
| s.c_str() | C-style const char* | - |
| s.starts_with(t) / s.ends_with(t) | C++20 | true for "hello" |
| to_string(x) | number to string | to_string(42) = "42" |
| stoi / stol / stoll / stod(s) | string to number | stoi("123") = 123 |
| getline(cin, s) | read a whole line | - |
| reverse(s.begin(), s.end()) | reverse in place | - |
| sort(s.begin(), s.end()) | sort characters | - |
| toupper(c) / tolower(c) | change one char's case | - |
```cpp
string s = "Hello, World";
for (char& c : s) c = toupper(c);                              // HELLO, WORLD
transform(s.begin(), s.end(), s.begin(), ::tolower);           // hello, world
int vowels = count_if(s.begin(), s.end(), [](char c) { return string("aeiou").find(c) != string::npos; });
if (s.find("world") != string::npos) cout << "found\n";
// split a sentence into words
stringstream ss("the quick brown fox"); string word; vector<string> words;
while (ss >> word) words.push_back(word);
// split by a custom delimiter
stringstream csv("a,b,c"); string cell; while (getline(csv, cell, ',')) cout << cell << "\n";
// build a string from numbers
ostringstream out; out << "x=" << 5 << ", y=" << 2.5; string built = out.str();
// character checks from <cctype>
isdigit('7'); isalpha('a'); isalnum('_'); isspace(' '); isupper('A'); islower('a'); ispunct('!');
int digit = '7' - '0';  char next = 'a' + 1;                   // 7, 'b'
// C strings
char buf[20] = "abc"; strlen(buf); strcat(buf, "def"); strcmp("a", "b"); strcpy(buf, "new"); memset(buf, 0, sizeof buf);
```
## Algorithm Library Functions You Must Know
```cpp
vector<int> v = {5, 2, 8, 2, 9, 1};
sort(v.begin(), v.end());                          // 1 2 2 5 8 9
sort(v.rbegin(), v.rend());                        // descending
stable_sort(v.begin(), v.end());                   // keeps the order of equal items
reverse(v.begin(), v.end());
*max_element(v.begin(), v.end()); *min_element(v.begin(), v.end());
auto [mn, mx] = minmax_element(v.begin(), v.end());
count(v.begin(), v.end(), 2);                      // how many 2s
find(v.begin(), v.end(), 8) != v.end();            // exists?
accumulate(v.begin(), v.end(), 0LL);               // sum
binary_search(v.begin(), v.end(), 5);              // sorted range only
lower_bound(v.begin(), v.end(), 5) - v.begin();    // first index with value >= 5
upper_bound(v.begin(), v.end(), 5) - v.begin();    // first index with value > 5
v.erase(unique(v.begin(), v.end()), v.end());      // remove adjacent duplicates (sort first)
next_permutation(v.begin(), v.end());              // next lexicographic order
rotate(v.begin(), v.begin() + 2, v.end());         // left rotate by 2
fill(v.begin(), v.end(), 0); iota(v.begin(), v.end(), 1);   // 1 2 3 ...
all_of / any_of / none_of(v.begin(), v.end(), pred);
nth_element(v.begin(), v.begin() + k, v.end());    // k-th smallest in O(n) average
swap(v[0], v[1]); max({1, 5, 3}); min(4, 2); clamp(15, 0, 10);
```
## File Handling in C++ (complete)
| Class | Use |
|---|---|
| ofstream | write to a file |
| ifstream | read from a file |
| fstream | both |
| Mode | Meaning |
|---|---|
| ios::in | open for reading |
| ios::out | open for writing (creates / truncates) |
| ios::app | append at the end |
| ios::trunc | erase existing content |
| ios::binary | raw bytes, no newline translation |
| ios::ate | start at the end |
```cpp
#include <fstream>
#include <sstream>
// write text
ofstream out("students.txt");
if (!out) { cerr << "cannot open file\n"; return 1; }
out << "Asha 91\nRavi 78\n";
out.close();                                    // also closes automatically at the end of scope (RAII)
// append
ofstream app("students.txt", ios::app); app << "Meena 85\n";
// read word by word
ifstream in("students.txt"); string name; int marks;
while (in >> name >> marks) cout << name << " -> " << marks << "\n";
// read line by line
ifstream in2("students.txt"); string line;
while (getline(in2, line)) cout << line << "\n";
// read a whole file into a string
ifstream f("students.txt"); stringstream buffer; buffer << f.rdbuf(); string all = buffer.str();
// binary write / read of a struct
struct Rec { int id; double score; };
Rec r{1, 9.5};
ofstream bout("data.bin", ios::binary); bout.write(reinterpret_cast<char*>(&r), sizeof r); bout.close();
Rec back; ifstream bin("data.bin", ios::binary); bin.read(reinterpret_cast<char*>(&back), sizeof back);
// move around inside a file
bin.seekg(0, ios::end); long size = bin.tellg(); bin.seekg(0, ios::beg);
// state checks
in.eof(); in.fail(); in.good(); in.clear();
```
@flow (Open file with a mode) | <Opened? ~ print error, stop> | Read or write in a loop | (Close file - automatic when the object goes out of scope) :: File handling steps
## Type Conversion and Useful Limits
```cpp
INT_MAX; INT_MIN; LLONG_MAX; numeric_limits<double>::max(); numeric_limits<int>::min();
static_cast<double>(7) / 2;                 // 3.5   normal safe cast
const_cast<int&>(constRef);                 // removes const (rarely correct)
reinterpret_cast<char*>(&obj);              // raw bytes view
dynamic_cast<Derived*>(basePtr);            // safe downcast, nullptr if the object is not that type
(char)('a' + 2); (int)'A';                  // 'c', 65
```
## Control Flow
### if / else if / else and switch
```cpp
int marks = 78;
if (marks >= 90) cout << "A";
else if (marks >= 75) cout << "B";
else cout << "C";

char op = '+';
switch (op) {
    case '+': cout << "add"; break;   // break prevents falling into the next case
    case '-': cout << "sub"; break;
    default:  cout << "unknown";
}
```
### Loops
```cpp
for (int i = 0; i < 5; i++) cout << i << " ";       // 0 1 2 3 4
int j = 0; while (j < 5) { cout << j; j++; }
int k = 0; do { cout << k; k++; } while (k < 5);   // runs at least once
vector<int> v = {1, 2, 3};
for (int x : v) cout << x;                          // range-based for
for (auto& x : v) x *= 2;                           // reference: modifies v
for (int i = 0; i < 10; i++) { if (i == 3) continue; if (i == 7) break; cout << i; }
```
@flow (i = 0) | <i < 5 ? ~ (exit loop)> | body: print i | ^i++ :: How a for loop runs
## Functions
- A function is a named, reusable block. Declare the return type, name, parameters.
- **Pass by value** copies the argument. **Pass by reference** (`int&`) lets the function modify the caller's variable without copying. **const reference** (`const string&`) = no copy and no modification - use it for big objects.
```cpp
int add(int a, int b) { return a + b; }
void increment(int& x) { x++; }                 // by reference
void show(const vector<int>& v) { for (int x : v) cout << x; }   // no copy
double area(double r, double pi = 3.14159) { return pi * r * r; }   // default argument
int maxOf(int a, int b) { return a > b ? a : b; }                   // overloading:
double maxOf(double a, double b) { return a > b ? a : b; }           // same name, different params
inline int sq(int x) { return x * x; }          // hint to paste the body at the call site
int fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }            // recursion
```
@stack fact(1) fact(2) fact(3) main() :: Call stack for fact(3): each call gets its own frame
## Arrays, Strings and Vectors
```cpp
int arr[5] = {1, 2, 3, 4, 5};            // fixed size, no bounds checking
int grid[3][3] = {{1,2,3},{4,5,6},{7,8,9}};
array<int, 5> sa = {1, 2, 3, 4, 5};      // std::array knows its size
vector<int> v;                           // dynamic array
v.push_back(10); v.push_back(20); v.insert(v.begin(), 5); v.pop_back();
vector<vector<int>> mat(3, vector<int>(4, 0));   // 3 x 4 matrix of zeros
string s = "hello";
s += " world"; s.size(); s[0] = 'H'; s.substr(6, 5); s.find("world");
reverse(s.begin(), s.end()); sort(v.begin(), v.end());
char cstr[] = "hi";                       // C string: ends with '\0'
```
## Pointers and References
### Pointers
- A pointer stores a **memory address**. `&x` = address of x, `*p` = value at the address (dereference).
@chain int x = 42 (address 0x1000) <- int* p = 0x1000 :: p points to x; *p == 42
```cpp
int x = 42;
int* p = &x;          // p holds the address of x
cout << *p;           // 42
*p = 50;              // changes x
int* q = nullptr;     // points nowhere - always check before *q
int arr[3] = {1, 2, 3};
int* it = arr;        // array name decays to a pointer to its first element
cout << *(it + 2);    // 3  (pointer arithmetic moves by sizeof(int))
int** pp = &p;        // pointer to pointer
```
### References
- A reference is an **alias** (another name) for an existing variable. It must be initialised and cannot be re-seated or null.
```cpp
int y = 10;
int& r = y;           // r is y
r = 20;               // y is now 20
```
| Pointer | Reference |
|---|---|
| can be null | never null |
| can point elsewhere later | bound forever |
| needs * to access | used like the variable |
| has its own address | same address as the target |
## Dynamic Memory
- `new` allocates on the heap and returns a pointer; `delete` frees it. Forgetting delete = **memory leak**. Using memory after delete = **dangling pointer**. Deleting twice = crash.
```cpp
int* one = new int(5);
int* many = new int[100];
delete one;
delete[] many;          // arrays need delete[]
```
> Modern C++ rule: never write `new` / `delete` yourself. Use `vector`, `string`, and **smart pointers** (section below) - they free memory automatically (RAII).
## Structures, Enums and Unions
```cpp
struct Point { int x = 0, y = 0; };            // members public by default
Point p{3, 4}; cout << p.x;
enum class Color { Red, Green, Blue };          // scoped enum (type-safe)
Color c = Color::Green;
union Data { int i; float f; };                 // members share the same memory
using ll = long long;                           // type alias
typedef vector<int> vi;
```
## Object-Oriented Programming in C++
@layers OOP | Encapsulation, Abstraction, Inheritance, Polymorphism :: The four pillars
### Classes and objects
- A **class** is a blueprint (data members + member functions). An **object** is an instance of it.
- Access specifiers: `private` (only inside the class - default for class), `protected` (class + derived classes), `public` (everyone).
```cpp
class BankAccount {
private:
    string owner;
    double balance;                     // hidden: encapsulation
public:
    BankAccount(string o, double b = 0) : owner(o), balance(b) {}   // constructor with initialiser list
    void deposit(double amt) { if (amt > 0) balance += amt; }
    bool withdraw(double amt) {
        if (amt > balance) return false;
        balance -= amt; return true;
    }
    double getBalance() const { return balance; }   // const: does not modify the object
};
int main() {
    BankAccount acc("Ravi", 1000);
    acc.deposit(500);
    acc.withdraw(200);
    cout << acc.getBalance();           // 1300
}
```
### Constructors and destructors
- **Default** constructor (no args), **parameterised**, **copy** constructor (`T(const T&)`), **move** constructor (`T(T&&)`). A **destructor** `~T()` runs automatically when the object dies - release resources there.
- `this` is a pointer to the current object. `explicit` stops implicit conversions through a 1-arg constructor.
```cpp
class Buffer {
    int* data; size_t n;
public:
    explicit Buffer(size_t n) : data(new int[n]()), n(n) { cout << "acquire\n"; }
    ~Buffer() { delete[] data; cout << "release\n"; }
    Buffer(const Buffer& o) : data(new int[o.n]), n(o.n) { copy(o.data, o.data + n, data); }   // deep copy
    Buffer& operator=(Buffer o) { swap(data, o.data); swap(n, o.n); return *this; }          // copy-and-swap
    Buffer(Buffer&& o) noexcept : data(o.data), n(o.n) { o.data = nullptr; o.n = 0; }         // move: steal
};
```
### Shallow copy vs deep copy and the Rule of 3 / 5 / 0
- The default copy copies pointer **values** (shallow): two objects would delete the same memory. If a class owns a resource, write copy constructor + copy assignment + destructor (**Rule of 3**), plus move constructor + move assignment (**Rule of 5**). Best: hold resources in vector/unique_ptr and write none of them (**Rule of 0**).
@chain obj A.data -> [heap block] <- obj B.data :: Shallow copy: both point to one block - double delete!
### Static members, friend and const
```cpp
class Counter {
    static int created;                        // shared by all objects
public:
    Counter() { created++; }
    static int count() { return created; }     // called as Counter::count()
    friend void peek(const Counter&);          // friend may access private members
};
int Counter::created = 0;                      // definition outside the class
```
### Inheritance
- A derived class reuses and extends a base class: "is-a" relationship (a Dog **is an** Animal).
- Types: single, multiple (class C : public A, public B), multilevel (A -> B -> C), hierarchical (A -> B, A -> C), hybrid.
- Modes: public inheritance keeps access levels; protected/private inheritance reduce them.
@tree Animal(Dog,Cat,Bird) :: Hierarchical inheritance
```cpp
class Animal {
protected:
    string name;
public:
    Animal(string n) : name(n) {}
    void eat() { cout << name << " eats\n"; }
};
class Dog : public Animal {
public:
    Dog(string n) : Animal(n) {}               // call the base constructor
    void bark() { cout << name << " barks\n"; }
};
Dog d("Tommy"); d.eat(); d.bark();
```
### The diamond problem and virtual inheritance
@tree Device(Printer(Copier),Scanner(Copier2)) :: Without virtual inheritance Copier holds TWO Device parts
```cpp
class Device { public: int id = 0; };
class Printer : virtual public Device {};
class Scanner : virtual public Device {};
class Copier : public Printer, public Scanner {};   // only ONE Device inside now
Copier c; c.id = 5;                                  // not ambiguous
```
### Polymorphism
- **Compile-time** (static): function overloading, operator overloading, templates.
- **Run-time** (dynamic): a base-class pointer/reference calls the derived class's **virtual** function - decided at run time through the **vtable**.
```cpp
class Shape {
public:
    virtual double area() const = 0;            // pure virtual -> Shape is abstract
    virtual ~Shape() = default;                 // ALWAYS virtual destructor in a base class
};
class Circle : public Shape {
    double r;
public:
    Circle(double r) : r(r) {}
    double area() const override { return 3.14159 * r * r; }
};
class Rect : public Shape {
    double w, h;
public:
    Rect(double w, double h) : w(w), h(h) {}
    double area() const override { return w * h; }
};
int main() {
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Circle>(1));
    shapes.push_back(make_unique<Rect>(2, 3));
    for (auto& s : shapes) cout << s->area() << "\n";   // 3.14159 then 6
}
```
### How virtual functions work (vtable)
- Every class with virtual functions has a **vtable** (table of function pointers). Each object stores a hidden **vptr** pointing to its class's vtable. A virtual call = follow vptr, look up the slot, jump. Cost: one indirection; it blocks inlining.
@chain Circle object (vptr) -> Circle vtable -> Circle::area :: Dynamic dispatch
> Without a virtual destructor, `delete basePtr` on a derived object runs only the base destructor - a leak.
### Abstraction and interfaces
- An **abstract class** has at least one pure virtual function and cannot be instantiated. A class with only pure virtual functions acts as an **interface**.
### Operator overloading
```cpp
struct Vec2 {
    double x, y;
    Vec2 operator+(const Vec2& o) const { return {x + o.x, y + o.y}; }
    bool operator==(const Vec2& o) const { return x == o.x && y == o.y; }
    friend ostream& operator<<(ostream& os, const Vec2& v) { return os << "(" << v.x << ", " << v.y << ")"; }
};
cout << Vec2{1, 2} + Vec2{3, 4};   // (4, 6)
```
### Composition vs inheritance
- **Composition** ("has-a"): a Car has an Engine - hold it as a member. Prefer composition: looser coupling, easier to change. Use inheritance only for a true "is-a" with shared behaviour.
## Templates and Generic Programming
- A template writes code once for any type; the compiler generates a version per type used (**instantiation**).
```cpp
template <typename T>
T maxOf(T a, T b) { return a > b ? a : b; }          // function template
template <typename T>
class Stack {                                         // class template
    vector<T> data;
public:
    void push(const T& x) { data.push_back(x); }
    T pop() { T t = data.back(); data.pop_back(); return t; }
    bool empty() const { return data.empty(); }
};
template <>                                           // full specialisation
const char* maxOf(const char* a, const char* b) { return strcmp(a, b) > 0 ? a : b; }
template <typename... Args>                           // variadic template
void printAll(Args... args) { ((cout << args << " "), ...); }   // C++17 fold expression
template <typename T> concept Number = is_arithmetic_v<T>;      // C++20 concept
template <Number T> T twice(T x) { return x * 2; }
int main() { cout << maxOf(3, 7) << maxOf(2.5, 1.5); Stack<string> s; s.push("hi"); printAll(1, "two", 3.0); }
```
## The STL (Standard Template Library)
@layers STL | Containers, Iterators, Algorithms, Function objects :: STL pieces
| Container | Underlying | Key operations cost |
|---|---|---|
| vector | dynamic array | push_back O(1)*, [] O(1), insert middle O(n) |
| deque | blocks of arrays | push/pop both ends O(1) |
| list | doubly linked list | insert/erase with iterator O(1) |
| stack / queue | adaptor on deque | push/pop O(1) |
| priority_queue | binary heap | push/pop O(log n), top O(1) |
| set / map | red-black tree | insert/find/erase O(log n), sorted |
| multiset / multimap | red-black tree | duplicates allowed |
| unordered_set / unordered_map | hash table | O(1) average |
```cpp
vector<int> v = {5, 2, 8, 1};
sort(v.begin(), v.end());                              // 1 2 5 8
sort(v.begin(), v.end(), [](int a, int b) { return a > b; });   // custom comparator
auto it = find(v.begin(), v.end(), 8);
bool has = binary_search(v.begin(), v.end(), 5);       // needs sorted range
int lb = lower_bound(v.begin(), v.end(), 5) - v.begin();
int total = accumulate(v.begin(), v.end(), 0);
int cnt = count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
transform(v.begin(), v.end(), v.begin(), [](int x) { return x * 10; });
v.erase(remove(v.begin(), v.end(), 50), v.end());      // erase-remove idiom
map<string,int> freq; freq["apple"]++;
for (auto& [k, val] : freq) cout << k << " " << val;   // structured bindings (C++17)
unordered_map<int,int> um; um.reserve(1 << 16);
set<int> st = {3, 1, 2}; st.insert(5); st.erase(1); auto up = st.upper_bound(2);
priority_queue<pair<int,string>> pq; pq.push({2, "b"}); pq.top();
```
### Iterators
- An iterator is a generalised pointer to a container element. `begin()` points to the first element, `end()` one past the last. Categories: input, output, forward, bidirectional (list, map), random access (vector, deque).
- **Iterator invalidation**: inserting into a vector may reallocate and invalidate all iterators/pointers to it.
## Lambdas and Functional Features
```cpp
auto add = [](int a, int b) { return a + b; };
int base = 10;
auto addBase = [base](int x) { return x + base; };     // capture by value
auto inc = [&base]() { base++; };                      // capture by reference
auto all = [=]() { return base; };                     // capture everything by value
function<int(int,int)> op = add;                        // type-erased callable
auto gen = [](auto x) { return x * 2; };               // generic lambda (C++14)
```
## Smart Pointers (RAII)
- **RAII** = Resource Acquisition Is Initialisation: tie a resource to an object's lifetime; the destructor frees it even if an exception is thrown.
| Smart pointer | Ownership | Use |
|---|---|---|
| unique_ptr | single owner, move-only | default choice |
| shared_ptr | shared, reference counted | several owners |
| weak_ptr | non-owning view of a shared_ptr | break cycles, caches |
```cpp
auto u = make_unique<BankAccount>("Asha", 500);       // freed automatically at scope end
auto u2 = std::move(u);                                // ownership moves; u is now null
auto s1 = make_shared<int>(7);
auto s2 = s1;                                          // use_count = 2
cout << s1.use_count();
weak_ptr<int> w = s1;
if (auto locked = w.lock()) cout << *locked;           // safe access if still alive
struct Node { shared_ptr<Node> next; weak_ptr<Node> prev; };   // weak breaks the cycle
```
## Move Semantics and Value Categories
- **lvalue**: has a name/address (x). **rvalue**: a temporary (x + 1, function return). `T&&` binds to rvalues.
- **Move** transfers the guts of a temporary instead of copying (e.g. steal a vector's buffer pointer: O(1) instead of O(n)).
- `std::move(x)` just casts x to an rvalue - "you may steal from me". `std::forward` keeps the value category in templates (perfect forwarding).
```cpp
vector<string> build() { vector<string> v(1000000, "x"); return v; }   // moved / elided, not copied
vector<string> a = build();
vector<string> b = std::move(a);       // O(1): b takes a's buffer; a is valid but empty
template <typename T, typename... A>
unique_ptr<T> create(A&&... args) { return unique_ptr<T>(new T(std::forward<A>(args)...)); }
```
## Exception Handling
```cpp
double divide(double a, double b) {
    if (b == 0) throw invalid_argument("division by zero");
    return a / b;
}
int main() {
    try { cout << divide(10, 0); }
    catch (const invalid_argument& e) { cerr << "Error: " << e.what() << "\n"; }
    catch (...) { cerr << "unknown error\n"; }
}
class InsufficientFunds : public runtime_error {
public: InsufficientFunds() : runtime_error("insufficient funds") {}
};
void f() noexcept { }                 // promises not to throw
```
- **Exception safety**: basic (no leaks), strong (commit-or-rollback), nothrow. RAII gives you the basic guarantee for free.
## Modern C++ Features (11 / 14 / 17 / 20)
| Feature | Example |
|---|---|
| auto, range-for | for (auto& x : v) |
| nullptr | int* p = nullptr; |
| uniform init | vector<int> v{1, 2, 3}; |
| constexpr | constexpr int f(int x) { return x * x; } |
| structured bindings | auto [a, b] = pair{1, 2}; |
| optional / variant / any | optional<int> find(); |
| string_view | non-owning view of a string |
| if constexpr | compile-time branches in templates |
| concepts (C++20) | template <integral T> |
| ranges (C++20) | v or views::filter(...) pipelines |
| coroutines (C++20) | co_await / co_yield |
| modules (C++20) | import std; |
```cpp
optional<int> findIndex(const vector<int>& v, int x) {
    for (int i = 0; i < (int)v.size(); i++) if (v[i] == x) return i;
    return nullopt;
}
variant<int, string> val = "hello"; if (holds_alternative<string>(val)) cout << get<string>(val);
#include <ranges>
for (int x : v | views::filter([](int x) { return x % 2; }) | views::transform([](int x) { return x * x; })) cout << x;
```
## Multithreading and Concurrency
- A **thread** is an independent flow of execution inside a process sharing its memory. Shared data needs synchronisation or you get a **race condition**.
```cpp
#include <thread>
#include <mutex>
#include <atomic>
#include <future>
mutex m; int counter = 0; atomic<int> fast{0};
void work() {
    for (int i = 0; i < 100000; i++) {
        lock_guard<mutex> lock(m);      // locked until end of scope
        counter++;
        fast++;                          // atomic: no mutex needed
    }
}
int main() {
    thread t1(work), t2(work);
    t1.join(); t2.join();               // wait for both
    cout << counter;                    // 200000 (always, thanks to the mutex)
    auto fut = async(launch::async, [] { return 6 * 7; });
    cout << fut.get();                  // 42
}
```
### Producer-consumer with a condition variable
```cpp
queue<int> q; mutex qm; condition_variable cv; bool done = false;
void producer() { for (int i = 0; i < 5; i++) { { lock_guard<mutex> l(qm); q.push(i); } cv.notify_one(); } { lock_guard<mutex> l(qm); done = true; } cv.notify_all(); }
void consumer() {
    while (true) {
        unique_lock<mutex> l(qm);
        cv.wait(l, [] { return !q.empty() || done; });
        if (q.empty() && done) return;
        int x = q.front(); q.pop(); l.unlock();
        cout << "got " << x << "\n";
    }
}
```
- Deadlock: two threads each hold a lock the other needs. Avoid by always locking in the same order or using `scoped_lock(m1, m2)`.
## Memory Model, Undefined Behaviour and Debugging
- Undefined behaviour (UB): out-of-bounds access, using uninitialised variables, signed overflow, dangling pointers, data races. The program may "work" and then crash later.
- Tools: `-fsanitize=address,undefined` (AddressSanitizer), Valgrind (leaks), gdb/lldb (breakpoints, backtrace), `-Wall -Wextra`.
- Object size and **padding/alignment**: struct members are aligned; order members from largest to smallest to reduce padding.
## Build Systems and Project Structure
```txt
project/
  CMakeLists.txt
  include/bank/account.h     (declarations)
  src/account.cpp            (definitions)
  src/main.cpp
  tests/account_test.cpp     (GoogleTest)
```
```txt
cmake_minimum_required(VERSION 3.20)
project(Bank CXX)
set(CMAKE_CXX_STANDARD 17)
add_executable(bank src/main.cpp src/account.cpp)
target_include_directories(bank PRIVATE include)
```
- Header guards (`#pragma once`) stop double inclusion. Declarations go in .h, definitions in .cpp; the linker joins them.
## Design Patterns in C++ (quick)
```cpp
class Logger {                                 // Singleton (thread-safe since C++11)
public:
    static Logger& get() { static Logger inst; return inst; }
    void log(const string& s) { cout << s << "\n"; }
private:
    Logger() = default;
    Logger(const Logger&) = delete; Logger& operator=(const Logger&) = delete;
};
unique_ptr<Shape> makeShape(const string& kind) {        // Factory
    if (kind == "circle") return make_unique<Circle>(1);
    return make_unique<Rect>(1, 1);
}
```
More patterns (Observer, Strategy, Builder, Adapter, Decorator) with diagrams are in notebook 04 (OOP) and notebook 12 (Low Level Design).
## Mini Project: Library Management System
```cpp
#include <bits/stdc++.h>
using namespace std;
class Book {
public:
    int id; string title; bool issued = false;
    Book(int i, string t) : id(i), title(move(t)) {}
};
class Member {
public:
    int id; string name; vector<int> books;
    Member(int i, string n) : id(i), name(move(n)) {}
};
class Library {
    unordered_map<int, Book> books; unordered_map<int, Member> members;
public:
    void addBook(int id, const string& t) { books.emplace(id, Book(id, t)); }
    void addMember(int id, const string& n) { members.emplace(id, Member(id, n)); }
    bool issue(int bookId, int memberId) {
        auto b = books.find(bookId); auto m = members.find(memberId);
        if (b == books.end() || m == members.end() || b->second.issued) return false;
        b->second.issued = true; m->second.books.push_back(bookId); return true;
    }
    bool giveBack(int bookId, int memberId) {
        auto& v = members.at(memberId).books;
        auto it = find(v.begin(), v.end(), bookId);
        if (it == v.end()) return false;
        v.erase(it); books.at(bookId).issued = false; return true;
    }
    void report() const { for (auto& [id, b] : books) cout << id << " " << b.title << (b.issued ? " [issued]" : "") << "\n"; }
};
int main() {
    Library lib; lib.addBook(1, "Clean Code"); lib.addBook(2, "CLRS"); lib.addMember(7, "Kiran");
    lib.issue(1, 7); lib.report(); lib.giveBack(1, 7); lib.report();
}
```
## C++ Interview Questions
Q: Difference between C and C++?
A: C is procedural; C++ adds classes, inheritance, polymorphism, templates, exceptions, references, namespaces, STL and RAII.
Q: What is the difference between struct and class?
A: Only default access: struct members/inheritance are public by default, class members are private by default.
Q: What is a virtual function and a pure virtual function?
A: A virtual function is resolved at run time through the vtable so the derived version runs. A pure virtual (`= 0`) has no body in the base and makes the class abstract.
Q: Why must a base class destructor be virtual?
A: So that deleting a derived object through a base pointer calls the derived destructor first; otherwise resources of the derived part leak (undefined behaviour).
Q: Explain new/delete vs malloc/free.
A: new calls constructors and returns a typed pointer, throws bad_alloc on failure; malloc only allocates raw bytes and returns NULL on failure. Never mix them.
Q: What is a dangling pointer and a memory leak?
A: Dangling: pointer to memory that was freed. Leak: allocated memory that is never freed and no longer reachable. Smart pointers prevent both.
Q: unique_ptr vs shared_ptr?
A: unique_ptr has one owner, zero overhead, move-only. shared_ptr keeps an atomic reference count and frees when the count hits zero; use weak_ptr to break cycles.
Q: What is move semantics?
A: Transferring resources from a temporary (rvalue) instead of deep copying, via move constructor/assignment taking T&&. Makes returning big containers cheap.
Q: What is the Rule of Three/Five/Zero?
A: If you define one of destructor/copy ctor/copy assignment you probably need all three (plus the two move operations = five). Best is zero: let members manage resources.
Q: Function overloading vs overriding?
A: Overloading = same name, different parameters, same scope, resolved at compile time. Overriding = derived class redefines a virtual base function with the same signature, resolved at run time.
Q: What is the diamond problem?
A: A class inherits from two classes that share a base, getting two copies of it. Solved with virtual inheritance.
Q: What is const correctness?
A: Marking things that must not change as const (parameters, member functions, return values) so the compiler enforces it.
Q: What does static mean in different places?
A: Inside a function: variable keeps its value between calls. Class member: shared by all objects. Global: internal linkage (visible only in that file).
Q: map vs unordered_map?
A: map is a red-black tree: sorted, O(log n). unordered_map is a hash table: unsorted, O(1) average, O(n) worst.
Q: What is a vtable cost?
A: One extra pointer per object (vptr), one table per class, and an indirect call that cannot be inlined.
Q: What is inline and when does it matter?
A: A hint to substitute the function body at the call site; today mainly used to allow a function definition in a header without ODR violations.
Q: How does std::vector grow?
A: When size reaches capacity it allocates a bigger buffer (1.5x-2x), moves elements over, frees the old one: push_back is O(1) amortised and iterators get invalidated.
Q: What is a race condition and how to fix it?
A: Two threads access shared data concurrently with at least one write and no synchronisation; fix with mutex, atomic, or by not sharing.
