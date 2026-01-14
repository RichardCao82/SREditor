import json
import os

# 读取 feature-schema.json
PATH = "./feature-schema.json"

if not os.path.exists(PATH):
    print(f"❌ 找不到文件: {PATH}")
    exit(1)

with open(PATH, "r", encoding="utf-8") as f:
    schema = json.load(f)

error_count = 0


def check_node(node, path):
    global error_count

    node_type = node.get("type")
    default = node.get("default")

    # 1. 检查 type 是否存在
    if node_type is None:
        print(f"❌ [{path}] 缺少 type 字段")
        error_count += 1

    # 2. boolean 类型检查
    if node_type == "boolean":
        if not isinstance(default, bool):
            print(f"❌ [{path}] boolean 类型 default 必须是 true/false，但现在是: {default}")
            error_count += 1

    # 3. checkbox 类型检查
    if node_type == "checkbox":
        if not isinstance(default, bool):
            print(f"❌ [{path}] checkbox 类型 default 必须是 true/false，但现在是: {default}")
            error_count += 1

    # 4. string / number 类型检查
    if node_type in ("string", "number"):
        if not isinstance(default, (str, int, float)):
            print(f"❌ [{path}] {node_type} 类型 default 必须是字符串或数字，但现在是: {default}")
            error_count += 1

    # 5. default 缺失
    if "default" not in node:
        print(f"❌ [{path}] 缺少 default 字段")
        error_count += 1

    # 6. children 检查
    children = node.get("children")
    if children is not None:
        if not isinstance(children, dict):
            print(f"❌ [{path}] children 必须是对象，但现在是: {children}")
            error_count += 1
        else:
            for key, sub in children.items():
                check_node(sub, f"{path}.{key}")


# 入口
for key, node in schema.items():
    check_node(node, key)

# 结果
if error_count == 0:
    print("🎉 check done: no issue!")
else:
    print(f"⚠️ check done: total find {error_count} issues")