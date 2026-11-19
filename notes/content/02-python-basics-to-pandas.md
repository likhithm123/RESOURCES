# Python - From Zero to Advanced, NumPy and Pandas
Python is the easiest first language and the main language of data science and AI. This notebook goes from installing Python to OOP, decorators, generators, async, testing, NumPy and Pandas, with runnable examples.
## Getting Started
### What is Python
- An **interpreted**, dynamically typed, high-level language (Guido van Rossum, 1991). Code is compiled to bytecode and run by the CPython virtual machine.
- Strengths: readable, huge library ecosystem (pip / PyPI). Weakness: slower than C++ for raw loops; the **GIL** lets only one thread run Python bytecode at a time.
- Used for: AI/ML, data analysis, web back ends (Django, FastAPI, Flask), automation, scripting, testing.
@chain script.py -> Bytecode compiler -> .pyc bytecode -> Python Virtual Machine -> Output :: How Python runs
```sh
python3 --version
python3 -m venv .venv && source .venv/bin/activate     # isolated environment per project
pip install pandas numpy requests                       # install packages
pip freeze > requirements.txt                           # record versions
python3 app.py
```
### First program
```py
print("Hello, World!")
name = input("Your name: ")
print(f"Welcome, {name}!")      # f-string formatting
```
## Variables, Data Types and Operators
- A variable is a **name bound to an object**. Everything in Python is an object with a type, identity (`id`) and value.
| Type | Example | Mutable? |
|---|---|---|
| int | 42, 10**100 (unlimited size) | no |
| float | 3.14, 1e-9 | no |
| complex | 2 + 3j | no |
| bool | True, False | no |
| str | "hello" | no |
| list | [1, 2, 3] | yes |
| tuple | (1, 2) | no |
| dict | {"a": 1} | yes |
| set | {1, 2} | yes |
| NoneType | None | no |
```py
x = 10; y = 3
print(x / y, x // y, x % y, x ** y)    # 3.333 3 1 1000
a, b = 1, 2; a, b = b, a               # swap
print(type(x), isinstance(x, int))
int("42"); float("2.5"); str(99); bool(0)   # conversions; bool(0) is False
print(0.1 + 0.2 == 0.3)                # False - floating point! use math.isclose
print(1 < 5 < 10)                      # chained comparison: True
```
- **Truthy / falsy**: 0, 0.0, "", [], {}, set(), None are False; everything else True.
- `is` checks identity (same object), `==` checks equality of values. Use `x is None`.
## Strings
```py
s = "Hello, Python"
s[0], s[-1], s[0:5], s[::-1]           # 'H' 'n' 'Hello' reversed
s.lower(), s.upper(), s.title()
s.split(", ")                          # ['Hello', 'Python']
"-".join(["a", "b", "c"])              # 'a-b-c'
s.replace("Python", "World"); s.find("Py"); s.count("l")
s.strip(), s.startswith("He"), s.isdigit()
f"{3.14159:.2f} | {42:05d} | {'left':<8}|"   # formatting
multi = """multi
line"""
raw = r"C:\new\folder"                 # raw string: backslashes kept
```
## Collections
### List (dynamic array)
```py
nums = [5, 2, 9]
nums.append(4); nums.extend([7, 8]); nums.insert(0, 1)
nums.pop(); nums.remove(9); nums.sort(); nums.reverse()
nums[1:3]; len(nums); 2 in nums; nums.index(5)
squares = [x * x for x in range(10) if x % 2 == 0]   # list comprehension
matrix = [[0] * 3 for _ in range(3)]                 # correct 2D list
bad = [[0] * 3] * 3                                  # WRONG: 3 references to one row
```
### Tuple, Set, Dict
```py
point = (3, 4); x, y = point               # unpacking
first, *rest = [1, 2, 3, 4]               # first=1, rest=[2,3,4]
s = {1, 2, 3}; s.add(4); s | {5}; s & {2, 9}; s - {1}     # union, intersection, difference
d = {"name": "Asha", "age": 21}
d["city"] = "Pune"; d.get("zip", "N/A"); d.pop("age")
for k, v in d.items(): print(k, v)
inv = {v: k for k, v in d.items()}        # dict comprehension
merged = {**d, "x": 1}; d |= {"y": 2}     # merge (3.9+)
```
| Operation | list | dict / set |
|---|---|---|
| index / key lookup | O(1) | O(1) average |
| x in collection | O(n) | O(1) average |
| append / add | O(1) amortised | O(1) average |
| insert/delete at front | O(n) | - |
| sort | O(n log n) | - |
## Built-in Functions (no import needed)
| Function | What it does | Example -> result |
|---|---|---|
| print(a, b, sep=" ", end="\n") | show output | print("a", "b", sep="-") -> a-b |
| input(prompt) | read a line as a string | int(input()) |
| len(x) | number of items | len("abc") -> 3 |
| type(x) / isinstance(x, T) | type checks | isinstance(3, int) -> True |
| int / float / str / bool / complex | convert types | int("42") -> 42 |
| list / tuple / set / dict / frozenset | build collections | list("ab") -> ['a', 'b'] |
| range(start, stop, step) | lazy sequence of ints | list(range(1, 6, 2)) -> [1, 3, 5] |
| abs(x) | absolute value | abs(-7) -> 7 |
| round(x, n) | round to n decimals (banker's rounding on ties) | round(2.675, 2) -> 2.67, round(2.5) -> 2 |
| pow(a, b, mod) | power, optional modulus | pow(2, 10) -> 1024 |
| divmod(a, b) | (quotient, remainder) | divmod(17, 5) -> (3, 2) |
| min / max / sum | smallest, largest, total | max([3, 9, 4]) -> 9 |
| sorted(x, key=, reverse=) | new sorted list | sorted("bca") -> ['a', 'b', 'c'] |
| reversed(x) | reverse iterator | list(reversed([1, 2])) -> [2, 1] |
| enumerate(x, start=0) | (index, item) pairs | list(enumerate("ab")) -> [(0, 'a'), (1, 'b')] |
| zip(a, b) | pair up items | list(zip([1, 2], "ab")) -> [(1, 'a'), (2, 'b')] |
| map(f, x) / filter(f, x) | apply / keep | list(map(str, [1, 2])) -> ['1', '2'] |
| any(x) / all(x) | is any / every item true | all([1, 0]) -> False |
| ord(c) / chr(n) | character code / character | ord("a") -> 97, chr(65) -> 'A' |
| bin / oct / hex | number to text in base 2 / 8 / 16 | bin(5) -> '0b101' |
| id(x) / hash(x) | identity / hash value | - |
| open(path, mode) | open a file | open("a.txt", "w") |
| iter(x) / next(it) | make / advance an iterator | - |
| getattr / setattr / hasattr / dir | work with attributes by name | hasattr("a", "upper") -> True |
| callable(x) | can it be called? | callable(len) -> True |
| eval / exec | run code from a string (dangerous with user input) | avoid |
| help(x) | show documentation | help(str.split) |
```py
nums = [4, 1, 9, 3]
print(sum(nums), min(nums), max(nums), len(nums), sum(nums) / len(nums))     # 17 1 9 4 4.25
print(sorted(nums, reverse=True), sorted(["bb", "a", "ccc"], key=len))       # [9, 4, 3, 1] ['a', 'bb', 'ccc']
for i, x in enumerate(nums, start=1): print(i, x)
print(list(zip("abc", [1, 2, 3])), dict(zip("abc", [1, 2, 3])))
print(any(x > 8 for x in nums), all(x > 0 for x in nums))                    # True True
print(divmod(17, 5), pow(2, 10), pow(2, 10, 1000), abs(-3.5))                # (3, 2) 1024 24 3.5
```
## Rounding and Number Formatting
```py
x = 1234.56789
round(x, 2)                    # 1234.57
f"{x:.2f}"                     # '1234.57'   2 decimals
f"{x:,.2f}"                    # '1,234.57'  thousands separator
f"{x:10.1f}|"                  # '    1234.6|'  width 10
f"{42:05d} {42:<6}| {42:>6}| {42:^6}|"      # '00042 42    |     42|   42  |'
f"{0.256:.1%}"                 # '25.6%'
f"{255:b} {255:o} {255:x} {255:X}"           # '11111111 377 ff FF'
f"{1234567:e}"                 # '1.234567e+06'
f"{'hi':*^10}"                 # '****hi****'  fill with *
name, age = "Asha", 21
print(f"{name=} {age=}")       # name='Asha' age=21  (debug form)
"%s is %d years, %.1f" % (name, age, 5.25)    # old style
"{} is {}".format(name, age); "{n} is {a}".format(n=name, a=age)
import math
math.floor(2.9), math.ceil(2.1), math.trunc(-2.9), round(2.5), round(3.5)     # 2 3 -2 2 4  (ties go to even)
from decimal import Decimal, ROUND_HALF_UP
Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)            # Decimal('2.68') exact money maths
from fractions import Fraction; Fraction(1, 3) + Fraction(1, 6)               # Fraction(1, 2)
```
> round(2.5) is 2, not 3: Python rounds ties to the nearest even number. Use Decimal with ROUND_HALF_UP when you need school rounding, and never use float for money.
## The math Module
| Function | Result |
|---|---|
| math.sqrt(x) / math.isqrt(n) | square root (float) / integer square root |
| math.pow(a, b) / a ** b | power (float) / power (exact for ints) |
| math.floor / math.ceil / math.trunc | round down / up / toward zero |
| math.fabs(x) | absolute value as float |
| math.factorial(n) | n! |
| math.gcd(a, b) / math.lcm(a, b) | greatest common divisor / least common multiple |
| math.comb(n, r) / math.perm(n, r) | combinations / permutations |
| math.log(x) / log2 / log10 / math.exp(x) | logarithms and e^x |
| math.sin / cos / tan / radians / degrees | trigonometry |
| math.pi / math.e / math.inf / math.nan | constants |
| math.isclose(a, b) | safe float comparison |
| math.prod(list) / math.fsum(list) | product / accurate float sum |
| math.dist(p, q) / math.hypot(x, y) | distance |
```py
import math, random, statistics
math.isclose(0.1 + 0.2, 0.3)         # True (never compare floats with ==)
random.random(); random.randint(1, 6); random.choice(["a", "b"]); random.shuffle(nums); random.sample(range(100), 5); random.seed(42)
statistics.mean([1, 2, 3, 4]); statistics.median([1, 3, 9]); statistics.mode([1, 1, 2]); statistics.stdev([2, 4, 4, 5])
```
## String Methods (complete reference)
| Method | What it does | Example -> result |
|---|---|---|
| s.upper() / s.lower() / s.title() / s.capitalize() / s.swapcase() | change case | "hi there".title() -> 'Hi There' |
| s.strip() / s.lstrip() / s.rstrip() | remove spaces (or given chars) at the ends | "  x ".strip() -> 'x' |
| s.split(sep) / s.rsplit(sep, n) / s.splitlines() | break into a list | "a,b".split(",") -> ['a', 'b'] |
| sep.join(list) | glue a list into a string | "-".join(["a", "b"]) -> 'a-b' |
| s.replace(old, new, count) | substitute text | "aab".replace("a", "x", 1) -> 'xab' |
| s.find(t) / s.rfind(t) | index or -1 | "hello".find("l") -> 2 |
| s.index(t) | index or ValueError | - |
| s.count(t) | occurrences | "banana".count("an") -> 2 |
| s.startswith(t) / s.endswith(t) | prefix / suffix test | "a.py".endswith(".py") -> True |
| s.isdigit() / s.isalpha() / s.isalnum() / s.isspace() / s.isupper() / s.islower() | character class tests | "42".isdigit() -> True |
| s.zfill(n) / s.center(n) / s.ljust(n) / s.rjust(n) | pad | "7".zfill(3) -> '007' |
| s.partition(sep) | (before, sep, after) | "k=v".partition("=") -> ('k', '=', 'v') |
| s.removeprefix(p) / s.removesuffix(p) | 3.9+ | "img.png".removesuffix(".png") -> 'img' |
| s.encode() / b.decode() | text to bytes and back | "hi".encode() -> b'hi' |
| s[::-1] | reverse | "abc"[::-1] -> 'cba' |
| t in s | substring test | "ell" in "hello" -> True |
| s * 3 | repeat | "ab" * 3 -> 'ababab' |
```py
s = "  Hello, World!  "
clean = s.strip().lower()                      # 'hello, world!'
words = clean.replace(",", "").replace("!", "").split()      # ['hello', 'world']
print(" ".join(w.capitalize() for w in words))               # Hello World
is_pal = (t := "madam") == t[::-1]
from collections import Counter
Counter("mississippi").most_common(2)          # [('i', 4), ('s', 4)]
import re
re.findall(r"[\w.]+@[\w.]+", "mail a@x.com and b@y.in")      # ['a@x.com', 'b@y.in']
re.sub(r"\s+", " ", "too    many   spaces"); re.split(r"[,;]", "a,b;c"); bool(re.fullmatch(r"\d{6}", "560001"))
```
## List, Dict, Set and Tuple Methods (complete reference)
| List method | Effect |
|---|---|
| append(x) / extend(iterable) / insert(i, x) | add one / many / at position |
| pop(i) / remove(x) / clear() | remove by index / by value / all |
| index(x) / count(x) | find position / count |
| sort(key=, reverse=) / reverse() | in place |
| copy() / a[:] | shallow copy |
| Dict method | Effect |
|---|---|
| d[k] / d.get(k, default) | read (KeyError / default) |
| d[k] = v / d.update(other) / d.setdefault(k, v) | write |
| d.pop(k) / d.popitem() / del d[k] / d.clear() | remove |
| d.keys() / d.values() / d.items() | views for loops |
| k in d | key test |
| dict.fromkeys(keys, value) | build |
| Set method | Effect |
|---|---|
| add(x) / update(iter) / remove(x) / discard(x) / pop() | change |
| a.union(b) / a.intersection(b) / a.difference(b) / a.symmetric_difference(b) | set algebra (same as the operators) |
| a.issubset(b) / a.issuperset(b) / a.isdisjoint(b) | comparisons |
- Tuple: only `count(x)` and `index(x)` because tuples cannot change.
## File Handling in Python (complete)
| Mode | Meaning |
|---|---|
| "r" | read (default); error if the file is missing |
| "w" | write; creates the file or erases it |
| "a" | append at the end |
| "x" | create; error if it already exists |
| "r+" | read and write |
| "b" | binary (add to another mode: "rb", "wb") |
| "t" | text (default) |
@flow (open(path, mode) inside "with") | read() / readline() / for line in f / write() | (file closes automatically when the with block ends) :: File handling steps
```py
# write and append
with open("students.txt", "w", encoding="utf-8") as f:
    f.write("Asha,91\n")
    f.writelines(["Ravi,78\n", "Meena,85\n"])
with open("students.txt", "a", encoding="utf-8") as f:
    f.write("John,66\n")
# read: whole file, line list, or line by line (best for big files)
with open("students.txt", encoding="utf-8") as f:
    text = f.read()
with open("students.txt", encoding="utf-8") as f:
    lines = f.read().splitlines()
with open("students.txt", encoding="utf-8") as f:
    for line in f:
        name, marks = line.strip().split(",")
        print(name, int(marks))
# file pointer
with open("students.txt", "rb") as f:
    f.seek(5); chunk = f.read(4); pos = f.tell()
# errors
try:
    with open("missing.txt") as f: pass
except FileNotFoundError: print("no such file")
except PermissionError: print("not allowed")
# CSV
import csv
with open("out.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["name", "marks"]); w.writeheader(); w.writerow({"name": "Asha", "marks": 91})
with open("out.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
# JSON
import json
with open("config.json", "w") as f: json.dump({"debug": True, "ports": [80, 443]}, f, indent=2)
with open("config.json") as f: cfg = json.load(f)
# pickle = Python object serialization (never unpickle untrusted files)
import pickle
with open("model.pkl", "wb") as f: pickle.dump({"weights": [0.1, 0.2]}, f)
with open("model.pkl", "rb") as f: obj = pickle.load(f)
# paths, folders, copying
from pathlib import Path
import shutil, os
p = Path("data") / "raw" / "a.txt"
p.parent.mkdir(parents=True, exist_ok=True); p.write_text("hello"); p.read_text()
p.exists(); p.is_file(); p.suffix; p.stem; p.stat().st_size
for q in Path("data").rglob("*.txt"): print(q)
shutil.copy(p, "backup.txt"); os.rename("backup.txt", "b2.txt"); os.remove("b2.txt"); shutil.rmtree("data")
```
> Always use `with open(...)`: the file is closed even if an error happens. Always pass `encoding="utf-8"` for text.
## Control Flow
```py
marks = 82
if marks >= 90: grade = "A"
elif marks >= 75: grade = "B"
else: grade = "C"
label = "pass" if marks >= 40 else "fail"      # conditional expression
for i in range(0, 10, 2): print(i)            # 0 2 4 6 8
for i, name in enumerate(["a", "b"]): print(i, name)
for a, b in zip([1, 2], ["x", "y"]): print(a, b)
while marks > 0: marks -= 30
for n in range(2, 10):
    for d in range(2, n):
        if n % d == 0: break
    else: print(n, "is prime")                # for-else: runs when no break
match command.split():                        # structural pattern matching (3.10)
    case ["go", direction]: print("going", direction)
    case ["quit"]: print("bye")
    case _: print("unknown")
```
## Functions
```py
def greet(name, greeting="Hello"):            # default argument
    """Return a greeting (this is a docstring)."""
    return f"{greeting}, {name}!"
greet("Ravi"); greet(greeting="Hi", name="Ravi")    # keyword arguments
def total(*args, **kwargs):                   # any positional / keyword args
    return sum(args), kwargs
total(1, 2, 3, unit="kg")                     # (6, {'unit': 'kg'})
square = lambda x: x * x                      # anonymous function
list(map(square, [1, 2, 3])); list(filter(lambda x: x > 1, [1, 2, 3]))
from functools import reduce; reduce(lambda a, b: a * b, [1, 2, 3, 4])   # 24
def add(a: int, b: int) -> int: return a + b  # type hints (checked by mypy, not at run time)
```
> Mutable default trap: `def f(x, acc=[])` shares ONE list across calls. Use `acc=None` then `acc = acc or []`.
### Scope (LEGB) and closures
- Name lookup order: **L**ocal -> **E**nclosing -> **G**lobal -> **B**uilt-in. Use `global` / `nonlocal` to assign to outer names.
```py
def counter():
    count = 0
    def inc():
        nonlocal count
        count += 1
        return count
    return inc                     # closure remembers count
c = counter(); c(); c()            # 1, 2
```
## Modules, Packages and the Standard Library
```py
import math, random, os, sys, json, datetime, re, pathlib
from collections import Counter, defaultdict, deque, namedtuple
math.sqrt(16); random.randint(1, 6); os.getcwd()
json.dumps({"a": 1}); json.loads('{"a": 1}')
datetime.date.today(); re.findall(r"\d+", "a1b22c333")    # ['1', '22', '333']
pathlib.Path("data").mkdir(exist_ok=True)
if __name__ == "__main__":        # runs only when the file is executed directly
    print("main")
```
- A **module** is one .py file; a **package** is a folder of modules (with `__init__.py`).
## File Handling and Exceptions
```py
with open("notes.txt", "w", encoding="utf-8") as f:     # with closes the file automatically
    f.write("line 1\nline 2\n")
with open("notes.txt") as f:
    for line in f: print(line.strip())
import csv
with open("scores.csv", newline="") as f:
    for row in csv.DictReader(f): print(row["name"], row["score"])
try:
    value = int("abc")
except ValueError as e:
    print("bad number:", e)
except (TypeError, KeyError):
    pass
else:
    print("no error")
finally:
    print("always runs")
class InsufficientFunds(Exception): pass
raise InsufficientFunds("balance too low")
```
## Object-Oriented Programming in Python
```py
class BankAccount:
    bank_name = "SBI"                         # class attribute (shared)
    def __init__(self, owner, balance=0):     # constructor
        self.owner = owner                    # instance attribute
        self.__balance = balance              # name-mangled "private"
    def deposit(self, amt):
        if amt <= 0: raise ValueError("amount must be positive")
        self.__balance += amt
    @property
    def balance(self): return self.__balance  # read-only property
    @classmethod
    def from_csv(cls, line):                  # alternative constructor
        owner, bal = line.split(","); return cls(owner, float(bal))
    @staticmethod
    def is_valid_ifsc(code): return len(code) == 11
    def __str__(self): return f"{self.owner}: {self.__balance}"
    def __repr__(self): return f"BankAccount({self.owner!r}, {self.__balance})"
acc = BankAccount("Asha", 100); acc.deposit(50); print(acc, acc.balance)
```
### OOP in Python explained step by step
- **Class** = a blueprint. **Object** = one real thing made from it. `self` = "this object"; Python passes it automatically as the first argument of every method.
- **Instance attribute** (`self.x`) belongs to one object. **Class attribute** (written in the class body) is shared by all objects.
@chain class Student (blueprint) -> s1 = Student("Asha") -> s2 = Student("Ravi") :: One class, many independent objects
```py
class Student:
    school = "VIT"                         # class attribute: same for everyone
    count = 0
    def __init__(self, name, marks):       # runs when you write Student(...)
        self.name = name                   # instance attributes: different for each object
        self.marks = marks
        Student.count += 1
    def grade(self):                       # instance method
        return "A" if self.marks >= 90 else "B" if self.marks >= 75 else "C"
s1, s2 = Student("Asha", 91), Student("Ravi", 78)
print(s1.grade(), s2.grade(), Student.count, s1.school)     # A B 2 VIT
```
| Pillar | Simple meaning | Python tool |
|---|---|---|
| Encapsulation | keep data safe inside the object | _protected, __private, @property |
| Abstraction | show what it does, hide how | abc.ABC + @abstractmethod |
| Inheritance | child gets the parent's features | class Child(Parent), super() |
| Polymorphism | same method name, different behaviour | overriding, duck typing |
```py
# Encapsulation with a validated property
class Account:
    def __init__(self, balance=0): self.__balance = balance          # __ makes it private (name mangled)
    @property
    def balance(self): return self.__balance                         # read like an attribute
    @balance.setter
    def balance(self, value):
        if value < 0: raise ValueError("balance cannot be negative")
        self.__balance = value
a = Account(100); a.balance = 250; print(a.balance)                  # a.balance = -5 raises ValueError
# Three kinds of methods
class Temperature:
    def __init__(self, c): self.c = c
    def fahrenheit(self): return self.c * 9 / 5 + 32                 # instance method: uses self
    @classmethod
    def from_fahrenheit(cls, f): return cls((f - 32) * 5 / 9)        # class method: alternative constructor
    @staticmethod
    def is_valid(c): return c >= -273.15                             # static method: plain helper
# Composition: a Car HAS an Engine (prefer this over deep inheritance)
class Engine:
    def start(self): return "engine on"
class Car:
    def __init__(self): self.engine = Engine()
    def start(self): return self.engine.start() + ", car ready"
```
- **Method overloading** does not exist in Python (the last definition wins); use default arguments or `*args`. **Operator overloading** is done with magic methods (`__add__`, `__eq__`, `__lt__`, `__len__`, `__str__`).
- **Multiple inheritance** follows the **MRO** (`ClassName.__mro__`); `super()` calls the next class in that order.
- `__slots__ = ("x", "y")` saves memory by fixing the attribute list. `__del__` is the destructor (rarely needed).
### Inheritance, super() and MRO
```py
class Animal:
    def __init__(self, name): self.name = name
    def speak(self): return "..."
class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name); self.breed = breed
    def speak(self): return "Woof"            # overriding
class Robot: pass
class RoboDog(Dog, Robot): pass               # multiple inheritance
print(RoboDog.__mro__)                        # method resolution order (C3 linearisation)
for a in [Animal("x"), Dog("Tom", "lab")]: print(a.speak())   # polymorphism (duck typing)
```
### Abstract classes, dataclasses and magic methods
```py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
class Shape(ABC):
    @abstractmethod
    def area(self): ...
class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
@dataclass(order=True, frozen=True)
class Point:
    x: float
    y: float = 0.0
    tags: tuple = field(default=())
class Vector:
    def __init__(self, x, y): self.x, self.y = x, y
    def __add__(self, o): return Vector(self.x + o.x, self.y + o.y)
    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)
    def __len__(self): return 2
    def __getitem__(self, i): return (self.x, self.y)[i]
    def __call__(self): return (self.x ** 2 + self.y ** 2) ** 0.5
```
| Magic method | Triggered by |
|---|---|
| __init__ | creating an object |
| __str__ / __repr__ | print / repr |
| __len__ | len(obj) |
| __getitem__ | obj[i] |
| __iter__ / __next__ | for x in obj |
| __eq__ / __lt__ | == / < |
| __add__ | + |
| __enter__ / __exit__ | with obj |
| __call__ | obj() |
| __hash__ | dict keys / sets |
## Iterators and Generators
- An **iterable** gives an iterator (`iter()`); an **iterator** returns the next value (`next()`) until StopIteration.
- A **generator** function uses `yield`: it pauses and resumes, producing values lazily - constant memory even for huge streams.
```py
def countdown(n):
    while n > 0:
        yield n
        n -= 1
for x in countdown(3): print(x)                    # 3 2 1
squares = (x * x for x in range(10**9))            # generator expression - no huge list
def read_large(path):
    with open(path) as f:
        for line in f: yield line.rstrip()         # stream a 10 GB file line by line
import itertools
list(itertools.islice(itertools.count(10), 3))     # [10, 11, 12]
list(itertools.chain([1, 2], [3])); list(itertools.permutations("abc", 2))
```
## Decorators
- A decorator is a function that takes a function and returns a new function wrapping it - adds behaviour (logging, timing, caching, auth) without editing the original.
@chain @timer -> wrapper(*args) -> start clock -> original function -> stop clock, print -> return result :: How a decorator wraps a call
```py
import time, functools
def timer(func):
    @functools.wraps(func)                # keeps name and docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.perf_counter() - start:.4f}s")
        return result
    return wrapper
def retry(times):                         # decorator with arguments
    def deco(func):
        @functools.wraps(func)
        def wrapper(*a, **k):
            for i in range(times):
                try: return func(*a, **k)
                except Exception as e: last = e
            raise last
        return wrapper
    return deco
@timer
@retry(3)
def fetch(): return "ok"
@functools.lru_cache(maxsize=None)        # memoisation built in
def fib(n): return n if n < 2 else fib(n - 1) + fib(n - 2)
```
## Context Managers
```py
from contextlib import contextmanager
class Timer:
    def __enter__(self): self.t = time.time(); return self
    def __exit__(self, exc_type, exc, tb): print("elapsed", time.time() - self.t); return False
@contextmanager
def opened(path):
    f = open(path); 
    try: yield f
    finally: f.close()
with Timer(): sum(range(10**6))
```
## Memory Model and Internals
- Variables are references; assignment never copies. `b = a` makes both names point to the same list.
- **Shallow copy** (`copy.copy`, `list(a)`, `a[:]`) copies the outer container only; **deep copy** (`copy.deepcopy`) copies nested objects too.
- Memory management: **reference counting** frees an object when its count hits 0; a **cyclic garbage collector** handles reference cycles.
- Small ints (-5..256) and some strings are **interned** (shared), which is why `is` sometimes "works" for them - never rely on it.
@chain a -> [1, 2, [3, 4]] <- b :: b = a: one list, two names
```py
import copy
a = [1, 2, [3, 4]]
b = copy.copy(a); c = copy.deepcopy(a)
a[2].append(5)
print(b[2], c[2])          # [3, 4, 5]  [3, 4]
```
## Concurrency: Threads, Processes and Async
| Tool | Best for | Why |
|---|---|---|
| threading | I/O-bound (network, disk) | GIL is released while waiting on I/O |
| multiprocessing | CPU-bound (math, image processing) | separate processes, each has its own GIL |
| asyncio | thousands of concurrent I/O tasks | single thread, cooperative event loop |
```py
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import asyncio
def download(url): return len(url)
with ThreadPoolExecutor(max_workers=8) as ex:
    sizes = list(ex.map(download, ["a.com", "b.com"]))
def heavy(n): return sum(i * i for i in range(n))
if __name__ == "__main__":
    with ProcessPoolExecutor() as ex: print(list(ex.map(heavy, [10**6] * 4)))
async def fetch(i):
    await asyncio.sleep(1)               # non-blocking wait
    return i
async def main():
    results = await asyncio.gather(*(fetch(i) for i in range(100)))   # ~1 second total, not 100
    print(len(results))
asyncio.run(main())
```
## Type Hints, Testing and Code Quality
```py
from typing import Optional, Iterable, TypedDict, Protocol
def mean(xs: Iterable[float]) -> float: xs = list(xs); return sum(xs) / len(xs)
def find(users: dict[str, int], name: str) -> Optional[int]: return users.get(name)
# test_stats.py  - run with: pytest -q
import pytest
def test_mean(): assert mean([1, 2, 3]) == 2
def test_empty():
    with pytest.raises(ZeroDivisionError): mean([])
@pytest.mark.parametrize("xs,expected", [([2, 4], 3), ([5], 5)])
def test_many(xs, expected): assert mean(xs) == expected
```
- Tools: **black** / ruff (format + lint), **mypy** (types), **pytest** (tests), **logging** module instead of print, virtualenv + requirements.txt or **uv** / poetry.
## Working with APIs and Files
```py
import requests
r = requests.get("https://api.github.com/repos/python/cpython", timeout=10)
r.raise_for_status(); data = r.json(); print(data["stargazers_count"])
requests.post("https://httpbin.org/post", json={"name": "asha"}, headers={"Authorization": "Bearer TOKEN"})
import sqlite3
con = sqlite3.connect("app.db")
con.execute("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT)")
con.execute("INSERT INTO users(name) VALUES (?)", ("asha",))   # parameterised: no SQL injection
con.commit(); print(con.execute("SELECT * FROM users").fetchall())
```
## NumPy - Fast Numerical Arrays
- `ndarray` = typed, contiguous array. Operations run in C over the whole array (**vectorisation**), 10-100x faster than Python loops.
- **Broadcasting**: arrays of different shapes are stretched virtually so element-wise operations work: (3, 1) + (1, 4) -> (3, 4).
@grid 1 2 3 / 4 5 6 :: shape (2, 3): axis 0 = rows, axis 1 = columns
```py
import numpy as np
a = np.array([[1, 2, 3], [4, 5, 6]])
a.shape, a.ndim, a.dtype, a.size          # (2, 3) 2 int64 6
np.zeros((2, 3)); np.ones(3); np.arange(0, 10, 2); np.linspace(0, 1, 5); np.eye(3)
np.random.default_rng(42).normal(0, 1, size=(3, 3))
a[0, 1]; a[:, 1]; a[a > 2]                # indexing, slicing, boolean mask
a.reshape(3, 2); a.T; a.flatten()
a.sum(axis=0), a.mean(axis=1), a.max(), a.argmax()
a * 2; a + np.array([10, 20, 30])         # broadcasting
b = np.array([[1, 0], [0, 1], [1, 1]])
a @ b                                     # matrix multiply (2x3 @ 3x2 = 2x2)
np.where(a > 3, 1, 0); np.concatenate([a, a], axis=0); np.unique([1, 1, 2])
np.linalg.inv(np.array([[2, 0], [0, 2]])); np.linalg.norm([3, 4])   # 5.0
```
## Pandas - Data Analysis
### Series and DataFrame
- **Series**: 1-D labelled array. **DataFrame**: 2-D table of columns (each column a Series) with a row **index**.
@grid name age city / Asha 21 Pune / Ravi 25 Delhi / Meena 30 Pune :: A DataFrame: columns + index rows 0, 1, 2
```py
import pandas as pd
df = pd.DataFrame({"name": ["Asha", "Ravi", "Meena", "John"],
                   "age": [21, 25, 30, None],
                   "city": ["Pune", "Delhi", "Pune", "Mumbai"],
                   "salary": [50000, 65000, 80000, 72000]})
df.head(); df.tail(2); df.shape; df.columns; df.dtypes
df.info(); df.describe()                  # summary statistics
```
### Reading and writing data
```py
df = pd.read_csv("sales.csv", parse_dates=["date"])
df = pd.read_excel("report.xlsx", sheet_name="Q1")
df = pd.read_json("data.json"); df = pd.read_sql("SELECT * FROM orders", con)
df.to_csv("out.csv", index=False); df.to_parquet("out.parquet")
for chunk in pd.read_csv("huge.csv", chunksize=100_000): process(chunk)   # large files
```
### Selecting and filtering
```py
df["name"]; df[["name", "age"]]
df.loc[0, "name"]              # by label
df.iloc[0:2, 1:3]              # by position
df[df["age"] > 22]
df[(df["city"] == "Pune") & (df["salary"] > 60000)]
df.query("age > 22 and city == 'Pune'")
df[df["city"].isin(["Pune", "Delhi"])]
df[df["name"].str.startswith("A")]
```
### Cleaning data
```py
df.isna().sum()                                   # missing values per column
df["age"] = df["age"].fillna(df["age"].median())
df = df.dropna(subset=["salary"])
df = df.drop_duplicates()
df["city"] = df["city"].str.strip().str.title()
df["age"] = df["age"].astype(int)
df = df.rename(columns={"salary": "ctc"})
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["ctc"] = df["ctc"].clip(upper=df["ctc"].quantile(0.99))   # cap outliers
```
### Transforming
```py
df["ctc_lakh"] = df["ctc"] / 1e5
df["band"] = pd.cut(df["age"], bins=[0, 25, 35, 100], labels=["junior", "mid", "senior"])
df["tax"] = df["ctc"].apply(lambda x: x * 0.1 if x > 60000 else 0)
df["city_code"] = df["city"].map({"Pune": "PNQ", "Delhi": "DEL"})
df = df.sort_values(["city", "ctc"], ascending=[True, False])
df = pd.get_dummies(df, columns=["city"])          # one-hot encoding
```
### GroupBy (split - apply - combine)
@chain DataFrame -> split by city -> apply mean / sum on each group -> combine into result :: groupby
```py
df.groupby("city")["ctc"].mean()
df.groupby("city").agg(avg_ctc=("ctc", "mean"), people=("name", "count"), top=("ctc", "max"))
df.groupby(["city", "band"]).size().unstack(fill_value=0)
df["rank_in_city"] = df.groupby("city")["ctc"].rank(ascending=False)
df["city_avg"] = df.groupby("city")["ctc"].transform("mean")
pd.pivot_table(df, values="ctc", index="city", columns="band", aggfunc="mean")
pd.crosstab(df["city"], df["band"])
```
### Merging, joining and concatenating
| SQL | Pandas |
|---|---|
| INNER JOIN | pd.merge(a, b, on="id", how="inner") |
| LEFT JOIN | pd.merge(a, b, on="id", how="left") |
| FULL OUTER JOIN | how="outer" |
| UNION ALL | pd.concat([a, b]) |
| GROUP BY | df.groupby(...).agg(...) |
| WHERE | df[condition] / df.query(...) |
| ORDER BY | df.sort_values(...) |
```py
orders = pd.DataFrame({"order_id": [1, 2, 3], "cust_id": [10, 11, 10], "amount": [250, 120, 90]})
custs = pd.DataFrame({"cust_id": [10, 11, 12], "name": ["Asha", "Ravi", "Zoya"]})
pd.merge(orders, custs, on="cust_id", how="left")
pd.concat([df1, df2], ignore_index=True)
```
### Time series and window functions
```py
s = df.set_index("date")["sales"]
s.resample("M").sum()                  # monthly totals
s.rolling(7).mean()                    # 7-day moving average
s.shift(1); s.pct_change()             # previous value, growth %
df["date"].dt.year; df["date"].dt.day_name()
```
### Visualisation and performance
```py
import matplotlib.pyplot as plt
df.groupby("city")["ctc"].mean().plot(kind="bar", title="Average CTC by city"); plt.show()
df["ctc"].plot(kind="hist", bins=20)
df["category"] = df["category"].astype("category")   # saves memory for repeated strings
df.memory_usage(deep=True)
# avoid row loops: vectorise (df["a"] * df["b"]) instead of df.apply(..., axis=1) when possible
```
### Mini project: sales analysis in 15 lines
```py
import pandas as pd
sales = pd.read_csv("sales.csv", parse_dates=["date"])
sales = sales.dropna(subset=["amount"]).drop_duplicates()
sales["month"] = sales["date"].dt.to_period("M")
monthly = sales.groupby("month")["amount"].sum()
top_products = sales.groupby("product")["amount"].sum().nlargest(5)
by_region = sales.pivot_table(values="amount", index="region", columns="month", aggfunc="sum", fill_value=0)
growth = monthly.pct_change().mul(100).round(1)
print(monthly, top_products, by_region, growth, sep="\n\n")
```
## Python Interview Questions
Q: List vs tuple?
A: Lists are mutable and slightly bigger; tuples are immutable, hashable (can be dict keys) and signal fixed structure.
Q: What is the GIL?
A: The Global Interpreter Lock lets only one thread execute Python bytecode at a time in CPython, so threads do not speed up CPU-bound code; use multiprocessing or native extensions (NumPy) instead. (Python 3.13+ has an experimental free-threaded build.)
Q: Deep copy vs shallow copy?
A: Shallow copies only the outer object, inner objects are shared; deep copy recursively copies everything.
Q: What are decorators?
A: Functions that wrap another function to add behaviour, applied with @name; they take a function and return a new callable.
Q: Generator vs list?
A: A generator yields items lazily and keeps O(1) memory; a list materialises all items. Generators can be consumed only once.
Q: *args and **kwargs?
A: *args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict.
Q: How is memory managed?
A: Private heap, reference counting frees objects immediately at count 0, and a generational garbage collector cleans reference cycles.
Q: What is __init__ vs __new__?
A: __new__ creates and returns the instance (used for immutables/singletons); __init__ initialises the already created instance.
Q: Explain is vs ==.
A: is compares identity (same object in memory); == compares values via __eq__.
Q: What are Python's mutable default argument problems?
A: Defaults are evaluated once at definition time, so a mutable default is shared between calls.
Q: How do you handle a 20 GB CSV in pandas?
A: Read in chunks (chunksize), select only needed columns (usecols) with compact dtypes, or use Polars / DuckDB / Dask / Spark.
Q: apply vs vectorised operations?
A: Vectorised column arithmetic runs in C and is much faster; apply calls a Python function per row/element.
Q: loc vs iloc?
A: loc selects by labels (index names, column names, inclusive slices); iloc selects by integer positions (exclusive end).
Q: merge vs join vs concat?
A: merge joins on columns like SQL; join joins on the index; concat stacks DataFrames along an axis.
Q: How do you find and handle missing values?
A: df.isna().sum(); then drop (dropna), fill (fillna with mean/median/mode/ffill), or model-based imputation, depending on how much and why it is missing.
