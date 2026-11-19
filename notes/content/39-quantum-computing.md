# Quantum Computing: Qubits, Circuits & Algorithms
A comprehensive, handwritten-style notebook covering quantum computation, qubits, Bloch sphere geometry, unitary quantum gates, entanglement, Grover's search, Shor's factoring, and quantum error correction.

## Classical Bits vs Quantum Bits (Qubits)
- **Classical Bit:** The fundamental unit of classical information. Physical state is strictly binary: either voltage high (`1`) or voltage low (`0`).
- **Quantum Bit (Qubit):** The fundamental unit of quantum information, represented as a vector in a two-dimensional complex Hilbert space $\mathbb{C}^2$.
- **Superposition Principle:** A qubit can exist in a linear combination of both basis states $|0\rangle$ and $|1\rangle$ simultaneously:
  $$|\psi\rangle = \alpha |0\rangle + \beta |1\rangle \quad \text{where } \alpha, \beta \in \mathbb{C} \text{ and } |\alpha|^2 + |\beta|^2 = 1$$
  - $|\alpha|^2$: The exact probability of observing state $|0\rangle$ upon measurement.
  - $|\beta|^2$: The exact probability of observing state $|1\rangle$ upon measurement.
- **Measurement Collapse:** The moment a physical measurement device interacts with the qubit, the delicate superposition irreversibly collapses into either strictly $|0\rangle$ or strictly $|1\rangle$!

### Real-Life Story: The Spinning Coin on the Table
- Place a physical quarter flat on a wooden table. It is either facing **Heads ($0$)** or **Tails ($1$)**. You can inspect it, photograph it, or measure it without altering its state.
- Now flick the quarter with your thumb so it spins rapidly on its edge across the tabletop.
- While spinning at 2,000 RPM, is the coin Heads or Tails? **It is in a continuous superposition of both Heads and Tails at the same time!**
- The instant you slap your hand down on the coin to stop it (Measurement), you force it to collapse into either Heads or Tails with 50/50 probability!

@layers Classical Bit: Fixed Deterministic State (0 or 1) | Quantum Qubit: Continuous Superposition (alpha|0> + beta|1>) | Wavefunction Collapse: Irreversible Measurement to Basis State :: Classical Bit vs Quantum Superposition

---

## The Bloch Sphere Geometric Mental Model
- Any pure single-qubit quantum state can be mapped to a point on the surface of a three-dimensional unit sphere called the **Bloch Sphere**:
  $$|\psi\rangle = \cos\left(\frac{\theta}{2}\right) |0\rangle + e^{i\phi} \sin\left(\frac{\theta}{2}\right) |1\rangle$$
  - $\theta \in [0, \pi]$: Polar angle from the North Pole ($Z$-axis).
  - $\phi \in [0, 2\pi]$: Azimuthal angle around the Equator ($X$-$Y$ plane) representing quantum phase.
- **Geographic Points on the Bloch Sphere:**
  - **North Pole ($\theta = 0$):** Pure state $|0\rangle = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$.
  - **South Pole ($\theta = \pi$):** Pure state $|1\rangle = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$.
  - **Equator ($\theta = \pi/2$):** Equal superpositions:
    - $|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$ along $+X$ axis ($\phi = 0$).
    - $|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$ along $-X$ axis ($\phi = \pi$).
    - $|i\rangle = \frac{|0\rangle + i|1\rangle}{\sqrt{2}}$ along $+Y$ axis ($\phi = \pi/2$).

```
           |0> (North Pole)
             ^  Z-axis
             |
             |      . (theta, phi) state vector |psi>
             |    /
             |  /
  -Y <-------+-------> +Y (Equator: Phase phi)
           / | \
         /   |   \
       /     |     \
     L       v       X-axis
            |1> (South Pole)
```

---

## Quantum Logic Gates: Unitary Operators
- In quantum mechanics, any valid quantum operation (gate) on a closed system must be a **Unitary Matrix** ($U^\dagger U = I$), which guarantees:
  1. **Preservation of Total Probability:** Total probability always remains $\sum |c_i|^2 = 1.0$.
  2. **Reversibility:** Every quantum computation can be undone by applying the inverse gate $U^\dagger$!

### Single-Qubit Quantum Gates
1. **Pauli-X Gate (Quantum NOT / Bit-Flip):**
   $$X = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}, \quad X|0\rangle = |1\rangle, \quad X|1\rangle = |0\rangle$$
   Rotates the state vector by $\pi$ radians ($180^\circ$) around the $X$-axis of the Bloch sphere.
2. **Pauli-Z Gate (Phase-Flip):**
   $$Z = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}, \quad Z|0\rangle = |0\rangle, \quad Z|1\rangle = -|1\rangle$$
   Leaves $|0\rangle$ untouched, but flips the phase sign of $|1\rangle$.
3. **Hadamard Gate ($H$ - The Superposition Creator):**
   $$H = \frac{1}{\sqrt{2}} \begin{bmatrix} 1 & 1 \\ 1 & -1 \end{bmatrix}, \quad H|0\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}} = |+\rangle, \quad H|1\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}} = |-\rangle$$
   Rotates state vector around the diagonal axis $(X + Z)/\sqrt{2}$, transforming definite classical bits into equal superpositions!

### Multi-Qubit Controlled-NOT (CNOT) Gate
- Operates on two qubits: **Control Qubit** and **Target Qubit**.
  - If Control is $|0\rangle$, Target is left unchanged.
  - If Control is $|1\rangle$, Target is inverted via Pauli-X!
$$CNOT = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{bmatrix}$$

@flow [Input Qubit |0>] | [Hadamard Gate H (Creates 50/50 Superposition)] | [CNOT Gate (Entangles Qubit 0 with Qubit 1)] | [Bell State (|00> + |11>) / sqrt(2)] | (Maximal Quantum Entanglement) :: Quantum Circuit for Bell State Generation

---

## Quantum Entanglement & The Bell States
- When two or more qubits interact, their individual states merge into a single entangled composite wavefunction that **cannot be factored into independent product states**:
  $$|\psi\rangle \ne |\psi_A\rangle \otimes |\psi_B\rangle$$
- **The Canonical Bell State ($|\Phi^+\rangle$):**
  $$|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$$
- **Real-Life Story: The Telepathic Pair of Dice:**
  - Imagine you give Alice one die and send her to Tokyo, and give Bob the second die and send him to London.
  - Before rolling, neither die has a predetermined number.
  - Alice rolls her die in Tokyo. It lands on **4** (a completely random 1-in-6 outcome).
  - The exact instant Alice observes 4, Bob's die in London **instantly locks onto 4**, even if Bob is in another galaxy!
  - Einstein called this *"Spooky Action at a Distance"*, but it is proven by Bell's Inequality experiments to be the true law of nature!

---

## Quantum Algorithms: Exponential & Polynomial Speedup
| Algorithm | Problem Solved | Classical Complexity | Quantum Complexity | Speedup Type |
|---|---|---|---|---|
| **Deutsch-Jozsa** | Determine if a black-box function is constant or balanced | $O(2^{N-1} + 1)$ queries | $O(1)$ single query | **Exponential** |
| **Grover's Search** | Find an item in an unsorted database of $N$ records | $O(N)$ linear scan | $O(\sqrt{N})$ amplitude amplification | **Quadratic** |
| **Shor's Algorithm** | Prime integer factorization & discrete logarithm (Breaks RSA & ECC) | $O\left(e^{\sqrt[3]{(\ln N) (\ln \ln N)^2}}\right)$ (GNFS) | $O((\log N)^2 (\log \log N))$ polynomial | **Super-Polynomial / Exponential** |
| **Quantum Phase Estimation (QPE)** | Estimate eigenvalues of a unitary operator | $O(2^N)$ | $O(N^2)$ | **Exponential** |

### Grover's Algorithm: Amplitude Amplification Flow
1. **Initialize:** Put all $N = 2^n$ computational states into uniform superposition using $H^{\otimes n}$.
2. **Oracle Reflection ($O$):** Invert the phase sign of the target item $|w\rangle$: $|x\rangle \implies -|x\rangle$ if $x = w$.
3. **Diffuser Reflection ($D$):** Invert all state amplitudes about the mean amplitude ($D = 2|s\rangle\langle s| - I$).
4. **Repeat $\lfloor \frac{\pi}{4}\sqrt{N} \rfloor$ times:** The probability amplitude of the target state constructive interferes, growing from $\frac{1}{\sqrt{N}} \to 1.0$ while all non-target states destructive interfere to $0$!

@flow [Uniform Superposition of N Items] | [Oracle Phase Inversion: Flip Target Sign] | [Diffuser: Invert all amplitudes about Mean] | [Repeat sqrt(N) times: Target Amplitude grows to ~100%] | (Measure Target Item with Probability ~ 1.0) :: Grover's Quantum Search Algorithm Flowchart

---

## Hands-On Quantum Circuit with Qiskit
```python
# Create a 2-qubit entangled Bell State circuit in Qiskit
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# Step 1: Initialize quantum circuit with 2 qubits and 2 classical bits
qc = QuantumCircuit(2, 2)

# Step 2: Apply Hadamard gate to qubit 0 (creates superposition)
qc.h(0)

# Step 3: Apply CNOT with control=0, target=1 (creates entanglement)
qc.cx(0, 1)

# Step 4: Measure both qubits into classical bits
qc.measure([0, 1], [0, 1])

# Step 5: Execute 1,024 shots on simulated quantum processor
simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()

print("Quantum Circuit ASCII:")
print(qc.draw(output='text'))
print("\nMeasurement Distribution (1024 shots):")
print(counts)
```
- **Input:** Initial state $|00\rangle$.
- **Circuit Diagram:**
  ```text
       ┌───┐     ┌─┐   
  q_0: ┤ H ├──■──┤M├───
       └───┘┌─┴─┐└╥┘┌─┐
  q_1: ─────┤ X ├─╫─┤M├
            └───┘ ║ └╥┘
  c: 2/═══════════╩══╩═
                  0  1 
  ```
- **Output:**
  ```text
  Measurement Distribution (1024 shots):
  {'00': 516, '11': 508}
  ```
  *(Notice: States '01' and '10' occur **0 times** because the qubits are perfectly entangled!)*

---

## Quantum Error Correction & No-Cloning Theorem
- **The No-Cloning Theorem:** It is mathematically impossible to create an identical copy of an arbitrary unknown quantum state:
  $$U(|\psi\rangle \otimes |0\rangle) \ne |\psi\rangle \otimes |\psi\rangle$$
  - In classical computing, if a bit is noisy, you simply copy it 3 times (`000` or `111`) and take majority vote.
  - In quantum computing, you **cannot clone a qubit**!
- **Quantum Error Correction (Surface Codes):**
  - Entangles a single logical qubit across a 2D lattice of hundreds of physical **data qubits** and **syndrome measurement qubits**.
  - Measures parity observables ($X$-stabilizers for bit-flips, $Z$-stabilizers for phase-flips) without measuring or collapsing the underlying data state!
  - **The Fault-Tolerant Scale:** Requires ~1,000 to 10,000 physical noisy qubits to produce **1 fault-tolerant logical qubit**.
