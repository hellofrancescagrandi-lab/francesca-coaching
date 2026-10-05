import subprocess
try:
    with open('script.js', 'r') as f:
        js = f.read()
    # Let's try to run a quick node execution using the built-in jsc (JavaScriptCore) on mac!
    result = subprocess.run(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc', 'script.js'], capture_output=True, text=True)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print(e)
