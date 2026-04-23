
export interface MethodSignature {
    className: string;
    methodName: string;
    returnType: string;
    args: { type: string; name: string }[];
}

const LANGUAGE_HEADERS: Record<string, string> = {
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n",
    java: "import java.util.*;\nimport java.io.*;\nimport java.math.*;\n",
    python: "import sys\nimport math\nimport collections\nimport itertools\n",
};


export function parseCPP(code: string): MethodSignature | null {
    const classRegex = /class\s+(\w+)/;
    // Improved regex to handle multi-word types like "long long" or "unsigned int"
    const methodRegex = /((?:[\w:<>\[\]*&]+(?:\s+[\w:<>\[\]*&]+)*))\s+(\w+)\s*\(([^)]*)\)/;

    
    const classMatch = code.match(classRegex);
    if (!classMatch) return null;
    
    const methodMatch = code.match(methodRegex);
    if (!methodMatch) return null;
    
    const [_, returnType, methodName, argsRaw] = methodMatch;
    const args = argsRaw.split(',').map(arg => {
        const parts = arg.trim().split(/\s+/);
        if (parts.length < 2) return null;
        const name = parts.pop()!.replace(/[&*]/g, '').trim();
        const type = parts.join(' ').replace(/[&*]/g, '').trim();
        return { type, name };
    }).filter((a): a is { type: string; name: string } => a !== null && !!a.name);

    return {
        className: classMatch[1],
        methodName,
        returnType,
        args
    };
}

export function generateCPPDriver(sig: MethodSignature): string {
    let inputCode = "";
    let callArgs = sig.args.map(a => a.name).join(", ");

    sig.args.forEach(arg => {
        inputCode += `    ${arg.type} ${arg.name};\n    parse(${arg.name});\n`;
    });

    return `
template<typename T> void parse(T& v);
template<typename T> void parse(vector<T>& v);
template<typename T> void print(const T& v);
template<typename T> void print(const vector<T>& v);

template<typename T>
void parse(T& val) {
    char c;
    while(cin >> c && !isdigit(c) && c != '-' && c != '+');
    cin.putback(c);
    cin >> val;
}

template<typename T>
void parse(vector<T>& v) {
    char c;
    while(cin >> c && c != '[');
    while(cin >> c && c != ']') {
        cin.putback(c);
        T val;
        parse(val);
        v.push_back(val);
        while(cin >> c && c != ',' && c != ']');
        if(c == ']') break;
    }
}

template<typename T>
void print(const T& val) {
    cout << val;
}

template<typename T>
void print(const vector<T>& v) {
    cout << "[";
    for(size_t i = 0; i < v.size(); ++i) {
        print(v[i]);
        if(i != v.size() - 1) cout << ",";
    }
    cout << "]";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    ${sig.className} sol;
${inputCode}
    ${sig.returnType !== "void" ? "auto res = " : ""}sol.${sig.methodName}(${callArgs});
    ${sig.returnType === "void" ? "cout << \"Success\" << endl;" : "print(res); cout << endl;"}
    return 0;
}
`;
}



export function parsePython(code: string): MethodSignature | null {
    const classRegex = /class\s+(\w+):/;
    const methodRegex = /def\s+(\w+)\s*\(\s*self\s*,?([^)]*)\)/;
    
    const classMatch = code.match(classRegex);
    if (!classMatch) return null;
    
    const methodMatch = code.match(methodRegex);
    if (!methodMatch) return null;
    
    const [_, methodName, argsRaw] = methodMatch;

    const args = argsRaw.split(',').map(arg => {
        const parts = arg.trim().split(':').map(s => s.trim());
        const name = parts[0];
        const type = parts[1] || "any";
        return { type, name };
    }).filter(a => !!a.name);

    return {
        className: classMatch[1],
        methodName,
        returnType: "any",
        args
    };
}

export function generatePythonDriver(sig: MethodSignature): string {
    let callArgs = sig.args.map((a, i) => `_args[${i}]`).join(", ");

    return `
if __name__ == "__main__":
    import sys
    import json
    
    _input_data = sys.stdin.read().strip()
    # Handle both comma-separated and newline-separated inputs
    try:
        # Wrap in brackets and try to load as a list if it contains commas outside brackets
        # Simple heuristic: if it contains an unboxed comma, it's multiple args
        _args = json.loads("[" + _input_data + "]")
    except:
        # Fallback for newline separated or single values
        _args = []
        for line in _input_data.split('\\n'):
            if line.strip():
                try:
                    _args.append(json.loads(line.strip()))
                except:
                    # Last resort fallback for raw strings or unquoted values
                    _args.append(line.strip())

    sol = ${sig.className}()
    res = sol.${sig.methodName}(${callArgs})
    
    if res is None:
        print("Success")
    else:
        print(json.dumps(res, separators=(',', ':')))
`;
}


export function parseJava(code: string): MethodSignature | null {
    const classRegex = /class\s+(\w+)/;
    // Improved regex to handle modifiers and complex return types
    const methodRegex = /(?:public|private|static|protected|\s)+((?:[\w<>\[\]]+(?:\s+[\w<>\[\]]+)*))\s+(\w+)\s*\(([^)]*)\)/;

    
    const classMatch = code.match(classRegex);
    if (!classMatch) return null;
    
    const methodMatch = code.match(methodRegex);
    if (!methodMatch) return null;
    
    const [_, returnType, methodName, argsRaw] = methodMatch;
    const args = argsRaw.split(',').map(arg => {
        const parts = arg.trim().split(/\s+/);
        if (parts.length < 2) return null;
        const name = parts.pop()!;
        const type = parts.join(' ');
        return { type, name };
    }).filter((a): a is { type: string; name: string } => a !== null && !!a.name);

    return {
        className: classMatch[1],
        methodName,
        returnType,
        args
    };
}

export function generateJavaDriver(sig: MethodSignature): string {
    let inputCode = "";
    let callArgs = sig.args.map(a => a.name).join(", ");

    sig.args.forEach(arg => {
        if (arg.type.includes("[]")) {
            const baseType = arg.type.replace("[]", "");
            inputCode += `        ${arg.type} ${arg.name} = parse${baseType.charAt(0).toUpperCase() + baseType.slice(1)}Array(sc);\n`;
        } else {
            const capType = arg.type.charAt(0).toUpperCase() + arg.type.slice(1);
            inputCode += `        ${arg.type} ${arg.name} = parse${capType === "Int" ? "Int" : capType}(sc);\n`;
        }
    });

    return `
public class Main {
    static int parseInt(Scanner sc) {
        sc.useDelimiter("[^\\\\d-]+");
        return sc.nextInt();
    }
    
    static long parseLong(Scanner sc) {
        sc.useDelimiter("[^\\\\d-]+");
        return sc.nextLong();
    }
    
    static int[] parseIntArray(Scanner sc) {
        String line = sc.findInLine("\\\\[[^\\\\\]]*\\\\]");
        if(line == null) {
            sc.useDelimiter("(\\\\s*|\\\\s*,\\\\s*)");
            line = sc.next();
        }
        String[] parts = line.replaceAll("[\\\\[\\\\\]]", "").split("\\\\s*,\\\\s*|\\\\s+");
        List<Integer> list = new ArrayList<>();
        for(String s : parts) {
            if(!s.trim().isEmpty()) list.add(Integer.parseInt(s.trim()));
        }
        int[] arr = new int[list.size()];
        for(int i=0; i<list.size(); i++) arr[i] = list.get(i);
        return arr;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ${sig.className} sol = new ${sig.className}();
${inputCode}
        ${sig.returnType !== "void" ? sig.returnType + " res = " : ""}sol.${sig.methodName}(${callArgs});
        ${sig.returnType === "void" ? "System.out.println(\"Success\");" : 
          sig.returnType.includes("[][]") ? "System.out.println(Arrays.deepToString(res).replace(\" \", \"\"));" :
          sig.returnType.includes("[]") ? "System.out.println(Arrays.toString(res).replace(\" \", \"\"));" : 
          "System.out.println(res);"}

    }
}
`;
}



export function prepareCodeForExecution(code: string, language: string): { wrappedCode: string; headerLines: number } {
    const lang = language.toLowerCase();
    
    // 1. Inject Driver (if Solution class detected)
    let processedCode = code;
    let sig: MethodSignature | null = null;
    let driver = "";

    if (lang === "cpp" || lang === "c++") {
        sig = parseCPP(code);
        if (sig) driver = generateCPPDriver(sig);
    } else if (lang === "python") {
        sig = parsePython(code);
        if (sig) driver = generatePythonDriver(sig);
    } else if (lang === "java") {
        sig = parseJava(processedCode);
        if (sig) driver = generateJavaDriver(sig);
    }


    if (driver) {
        processedCode = code + "\n" + driver;
    } else {
        // Fail-safe debug comment (only if expected but failed)
        const classKeyword = lang === "python" ? "class Solution:" : "class Solution";
        if (code.includes(classKeyword)) {
            const commentPrefix = lang === "python" ? "#" : "//";
            processedCode = `${commentPrefix} [Driver Injection Skipped: Method signature not detected]\n` + code;
        }
    }

    // 2. Prepend Headers
    const header = LANGUAGE_HEADERS[lang];
    if (!header) return { wrappedCode: processedCode, headerLines: 0 };

    // Check if headers are already included by student
    const hasIncludes = lang === 'cpp' || lang === 'c++' ? code.includes('#include') : 
                        lang === 'java' ? code.includes('import ') :
                        lang === 'python' ? code.includes('import ') : false;

    if (hasIncludes) return { wrappedCode: processedCode, headerLines: 0 };

    const wrappedCode = header + "\n" + processedCode;
    const headerLines = header.split('\n').filter(l => l.trim() !== '').length + 1; 
    
    return { wrappedCode, headerLines };
}

// Keeping it for backward compatibility during refactor, but it's now internal to prepareCodeForExecution
export function wrapCodeWithDriver(code: string, language: string): string {
    return prepareCodeForExecution(code, language).wrappedCode;
}

