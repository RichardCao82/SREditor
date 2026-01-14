/* ============================================================
   app.js - 第 1 段
   初始化 + JSON 加载 + 工具函数
============================================================ */

/* ------------------------------
   全局数据结构
------------------------------ */
let featureSchema = {};       // 左侧功能定义（从 JSON 加载）
let loadedModuleDefs = [];    // Flow 模块定义（从 JSON 加载）
let flowModules = [];         // 用户选择的 Flow 模块列表

/* ------------------------------
   页面初始化：加载 JSON
------------------------------ */
window.addEventListener("DOMContentLoaded", () => {
    // 加载左侧功能定义
    fetch("data/feature-schema.json")
        .then(res => res.json())
        .then(json => {
            featureSchema = json;
            renderFeaturePanel();   // 左侧功能区渲染
        });

    // 加载右侧 Flow 模块定义
    fetch("data/flow-modules-sample.json")
        .then(res => res.json())
        .then(json => {
            loadedModuleDefs = json;
            renderFlowList();       // 右侧 Flow 列表渲染
        });

    bindGlobalEvents();             // 绑定按钮事件
});

/* ------------------------------
   工具函数：根据路径写入 featureSchema
   path 示例： "readBatteryInfo.readBatteryHealthy.stopWhenPoor"
------------------------------ */
function updateFeatureValue(path, value) {
    const keys = path.split(".");
    let node = featureSchema;

    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];

        if (i === keys.length - 1) {
            // 最后一级：写入 default
            node[k].default = value;
        } else {
            // 进入 children
            node = node[k].children;
        }
    }
}

/* ------------------------------
   Flow 模块图标映射
------------------------------ */
function getModuleIcon(name) {
    name = name.toLowerCase();

    if (name.includes("battery")) return "🔋";
    if (name.includes("refurbish")) return "🔧";
    if (name.includes("install")) return "📦";
    if (name.includes("read")) return "📘";
    if (name.includes("check")) return "🔍";
    if (name.includes("network")) return "🌐";
    if (name.includes("usb")) return "🔌";

    return "📁"; // 默认图标
}

/* ============================================================
   app.js - 第 2 段
   左侧功能区（折叠 + 自动展开/收起 + 双向绑定）
============================================================ */

/* ------------------------------
   渲染左侧功能区
------------------------------ */
function renderFeaturePanel() {
    const container = document.getElementById("featureContainer");
    container.innerHTML = "";

    Object.keys(featureSchema).forEach(key => {
        const card = createFeatureCard(key, featureSchema[key], key);
        container.appendChild(card);
    });
}

/* ------------------------------
   创建一个功能卡片（递归）
------------------------------ */
function createFeatureCard(key, node, path) {
    const card = document.createElement("div");
    card.className = "feature-card";

    /* --- Header --- */
    const header = document.createElement("div");
    header.className = "feature-header";

    /* 包裹整个 label 区域 */
	const labelWrapper = document.createElement("div");
	labelWrapper.style.display = "flex";
	labelWrapper.style.alignItems = "center";
	labelWrapper.style.gap = "6px";
	
	/* 1. 子项指示器（如果有 children） */
	if (node.children) {
		const childIndicator = document.createElement("span");
		childIndicator.textContent = "›";
		childIndicator.style.color = "#999";
		childIndicator.style.fontSize = "14px";
		childIndicator.style.marginRight = "2px";
		labelWrapper.appendChild(childIndicator);
	}
	
	/* 2. 文本 label */
	const label = document.createElement("span");
	label.className = "feature-label";
	label.textContent = node.label || key;
	labelWrapper.appendChild(label);
	
	/* 3. tooltip 图标放在最后 */
	const tooltip = document.createElement("div");
	tooltip.className = "tooltip-container";
	
	const icon = document.createElement("span");
	icon.className = "tooltip-icon";
	icon.textContent = "ⓘ";
	
	const bubble = document.createElement("div");
	bubble.className = "tooltip-bubble";
	bubble.textContent = node.help || "";
	
	tooltip.appendChild(icon);
	tooltip.appendChild(bubble);
	
	/* 放到最后 */
	labelWrapper.appendChild(tooltip);
	
	/* 放入 header */
	header.appendChild(labelWrapper);

    const control = createControl(node, path);

    header.appendChild(control);
    card.appendChild(header);

    /* --- 子级 --- */
    if (node.children) {
		const childContainer = document.createElement("div");
		childContainer.className = "feature-children collapsible";
	
		Object.keys(node.children).forEach(subKey => {
			const subNode = node.children[subKey];
			const subPath = `${path}.${subKey}`;
			const subCard = createFeatureCard(subKey, subNode, subPath);
			childContainer.appendChild(subCard);
		});
	
		card.appendChild(childContainer);
	
		/* 初始化：default=true → 自动展开 */
		if ((node.type === "boolean" || node.type === "switch") && node.default === true) {
			childContainer.classList.add("open");
		}
	
		/* 点击 header 手动折叠/展开 */
		header.onclick = e => {
			if (e.target.classList.contains("switch")) return;
			childContainer.classList.toggle("open");
		};
	}

    return card;
}

/* ------------------------------
   创建控件（switch / checkbox / text）
------------------------------ */
function createControl(node, path) {
    console.log("createControl:", path, node.type, node.default);
	const type = node.type;
    const value = node.default;

    /* --- Boolean → Switch --- */
    if (type === "boolean") {
        const sw = document.createElement("div");
        sw.className = "switch" + (value ? " on" : "");
        sw.dataset.path = path;

        sw.onclick = e => {
            e.stopPropagation();
            sw.classList.toggle("on");
            const newValue = sw.classList.contains("on");
            updateFeatureValue(path, newValue);

            /* 自动展开/收起子级 */
            const card = sw.closest(".feature-card");
            const childContainer = card.querySelector(".feature-children");
            if (childContainer) {
                if (newValue) childContainer.classList.add("open");
                else childContainer.classList.remove("open");
            }
        };

        return sw;
    }

    /* --- Checkbox（多选） --- */
    if (type === "checkbox") {
        const box = document.createElement("div");
        box.className = "checkbox" + (value ? " checked" : "");
        box.dataset.path = path;

        box.onclick = e => {
            e.stopPropagation();
            box.classList.toggle("checked");
            updateFeatureValue(path, box.classList.contains("checked"));
        };

        return box;
    }

    /* --- String / Number → Text Input --- */
    const input = document.createElement("input");
    input.type = "text";
    input.className = "input-box";
    input.value = value;
    input.dataset.path = path;

    input.onchange = () => {
        updateFeatureValue(path, input.value);
    };

    return input;
}

/* ============================================================
   app.js - 第 3 段
   Flow 模块区（拖拽 + 箭头 + 序号 + 图标 + 竖线）
============================================================ */

/* ------------------------------
   渲染 Flow 列表
------------------------------ */
function renderFlowList() {
    const list = document.getElementById("flowList");

    // 清空（保留最后的 + 按钮）
    const addBtn = document.getElementById("addFlowBtn");
    list.innerHTML = "";
    list.appendChild(addBtn);

    flowModules.forEach((module, index) => {
        const item = document.createElement("div");
        item.className = "flow-item";
        item.draggable = true;
        item.dataset.index = index;

        /* ------------------------------
           Header（图标 + 序号 + 名称 + 按钮）
        ------------------------------ */
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";

        /* 图标 + 序号 + 名称 */
        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "6px";

        const icon = document.createElement("span");
        icon.textContent = getModuleIcon(module.moduleName);
        icon.style.fontSize = "20px";

        const title = document.createElement("span");
        title.textContent = `${index + 1}. ${module.moduleDispalyName || module.moduleName}`;
        title.style.fontWeight = "600";

        left.appendChild(icon);
        left.appendChild(title);

        /* 折叠按钮 */
        const foldBtn = document.createElement("span");
        foldBtn.textContent = module.__open ? "▾" : "▸";
        foldBtn.style.cursor = "pointer";
        foldBtn.style.fontSize = "20px";
        foldBtn.style.marginRight = "10px";

        /* 删除按钮 */
        const delBtn = document.createElement("span");
        delBtn.textContent = "✕";
        delBtn.style.cursor = "pointer";
        delBtn.style.color = "#d33";
        delBtn.style.marginLeft = "10px";

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.alignItems = "center";
        right.appendChild(foldBtn);
        right.appendChild(delBtn);

        header.appendChild(left);
        header.appendChild(right);
        item.appendChild(header);

        /* ------------------------------
           Detail（折叠内容：input 预览）
        ------------------------------ */
        const detail = document.createElement("div");
        detail.style.display = module.__open ? "block" : "none";
        detail.style.marginTop = "10px";
        detail.innerHTML = `<pre>${JSON.stringify(module.input, null, 2)}</pre>`;
        item.appendChild(detail);

        /* 折叠按钮逻辑 */
        foldBtn.onclick = e => {
            e.stopPropagation();
            const isOpen = detail.style.display !== "none";
            detail.style.display = isOpen ? "none" : "block";
            foldBtn.textContent = isOpen ? "▸" : "▾";
            module.__open = !isOpen; // 记住用户选择
        };

        /* 删除模块 */
        delBtn.onclick = e => {
            e.stopPropagation();
            flowModules.splice(index, 1);
            renderFlowList();
        };

        /* 双击打开编辑器 */
        item.ondblclick = () => openModuleDialog(module);

        /* ------------------------------
           拖拽事件
        ------------------------------ */
        item.addEventListener("dragstart", handleDragStart);
        item.addEventListener("dragover", handleDragOver);
        item.addEventListener("drop", handleDrop);
        item.addEventListener("dragend", handleDragEnd);

        /* 插入模块卡片 */
        list.insertBefore(item, addBtn);

        /* ------------------------------
           插入箭头（不是最后一个）
        ------------------------------ */
        if (index < flowModules.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "flow-arrow";
            arrow.textContent = "↓";
            list.insertBefore(arrow, addBtn);
        }
    });
}

/* ============================================================
   拖拽排序（占位符滑动动画）
============================================================ */

let dragIndex = null;
let placeholder = null;

function handleDragStart(e) {
    dragIndex = Number(e.target.dataset.index);
    e.target.classList.add("dragging");

    placeholder = document.createElement("div");
    placeholder.className = "flow-placeholder";
    placeholder.style.height = `${e.target.offsetHeight}px`;
}

function handleDragOver(e) {
    e.preventDefault();

    const list = document.getElementById("flowList");
    const draggingItem = document.querySelector(".dragging");

    const target = [...list.children].find(item => {
        const rect = item.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
    });

    if (target && target !== placeholder) {
        list.insertBefore(placeholder, target);
    } else if (!target) {
        list.appendChild(placeholder);
    }
}

function handleDrop(e) {
    const list = document.getElementById("flowList");

    const newIndex = [...list.children].indexOf(placeholder);

    const moved = flowModules.splice(dragIndex, 1)[0];
    flowModules.splice(newIndex, 0, moved);

    placeholder.remove();
    placeholder = null;

    renderFlowList();
}

function handleDragEnd(e) {
    e.target.classList.remove("dragging");
    if (placeholder) placeholder.remove();
    placeholder = null;
}

/* ============================================================
   app.js - 第 4 段
   模块编辑器（动态表单 + 类型识别 + 嵌套结构）
============================================================ */

/* ------------------------------
   打开模块编辑对话框
------------------------------ */
function openModuleDialog(module) {
    const dialog = document.getElementById("moduleDialog");
    const info = document.getElementById("moduleInfo");
    const editor = document.getElementById("moduleInputEditor");

    /* 基本信息 */
    info.innerHTML = `
        <p><b>moduleName:</b> ${module.moduleName}</p>
        <p><b>moduleDispalyName:</b> ${module.moduleDispalyName}</p>
        <p><b>description:</b> ${module.description}</p>
        <p><b>dependence:</b> ${module.dependence}</p>
        <p><b>result_description:</b><pre>${JSON.stringify(module.result_description, null, 2)}</pre></p>
    `;

    /* 动态生成 input 编辑器 */
    editor.innerHTML = "";
    buildInputEditor(module.input, editor, "");

    dialog.classList.remove("hidden");

    /* 保存按钮 */
    document.getElementById("saveModuleInput").onclick = () => {
        module.input = readInputEditor(editor);
        dialog.classList.add("hidden");
        renderFlowList(); // 更新右侧折叠预览
    };
}

/* ============================================================
   动态表单生成器（核心）
============================================================ */

/*
  buildInputEditor(obj, container, path)
  - obj: 当前 JSON 对象
  - container: DOM 容器
  - path: JSON 路径，例如 "customizeIpsw.customizeIpsw.iPhone14,2"
*/
function buildInputEditor(obj, container, path) {
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fullPath = path ? `${path}.${key}` : key;

        const row = document.createElement("div");
        row.style.marginBottom = "14px";

        const label = document.createElement("div");
        label.textContent = key;
        label.style.fontWeight = "600";
        label.style.marginBottom = "4px";
        row.appendChild(label);

        /* 特殊字段（_comment / _sample） */
        if (key.startsWith("_")) {
            const pre = document.createElement("pre");
            pre.style.background = "#f0f0f0";
            pre.style.padding = "10px";
            pre.style.borderRadius = "8px";
            pre.textContent = JSON.stringify(value, null, 2);
            row.appendChild(pre);
            container.appendChild(row);
            return;
        }

        /* 类型识别 */
        if (typeof value === "string") {
            /* boolean 字符串 → switch */
            if (value === "true" || value === "false") {
                const sw = document.createElement("div");
                sw.className = "switch" + (value === "true" ? " on" : "");
                sw.dataset.path = fullPath;

                sw.onclick = () => {
                    sw.classList.toggle("on");
                };

                row.appendChild(sw);
            }

            /* 数字字符串 → number input */
            else if (/^\d+$/.test(value)) {
                const input = document.createElement("input");
                input.type = "number";
                input.className = "input-box";
                input.value = value;
                input.dataset.path = fullPath;
                row.appendChild(input);
            }

            /* 普通字符串 → text input */
            else {
                const input = document.createElement("input");
                input.type = "text";
                input.className = "input-box";
                input.value = value;
                input.dataset.path = fullPath;
                row.appendChild(input);
            }
        }

        /* 嵌套对象 */
        else if (typeof value === "object" && value !== null) {
            const sub = document.createElement("div");
            sub.style.marginLeft = "16px";
            sub.style.borderLeft = "2px solid #ddd";
            sub.style.paddingLeft = "12px";

            buildInputEditor(value, sub, fullPath);
            row.appendChild(sub);
        }

        container.appendChild(row);
    });
}

/* ============================================================
   读取动态表单内容（反向写回 JSON）
============================================================ */
function readInputEditor(container) {
    const result = {};

    [...container.children].forEach(row => {
        const key = row.children[0].textContent;

        /* switch */
        const sw = row.querySelector(".switch");
        if (sw) {
            result[key] = sw.classList.contains("on") ? "true" : "false";
            return;
        }

        /* input */
        const input = row.querySelector("input");
        if (input) {
            result[key] = input.value;
            return;
        }

        /* nested object */
        const sub = row.children[1];
        if (sub) {
            result[key] = readInputEditor(sub);
        }
    });

    return result;
}

/* ============================================================
   app.js - 第 5 段（最终段）
   导入 / 导出 + 全局事件绑定 + 初始化
============================================================ */

/* ------------------------------
   全局事件绑定
------------------------------ */
function bindGlobalEvents() {

    /* 点击 + 打开模块选择器 */
    document.getElementById("addFlowBtn").onclick = () => {
        if (!loadedModuleDefs || loadedModuleDefs.length === 0) {
            alert("模块定义尚未加载");
            return;
        }
        openModulePicker();
    };

    /* 关闭模块编辑对话框 */
    document.getElementById("closeDialog").onclick = () => {
        document.getElementById("moduleDialog").classList.add("hidden");
    };

    /* 关闭模块选择器 */
    document.getElementById("closePicker").onclick = () => {
        document.getElementById("modulePicker").classList.add("hidden");
    };

    /* ------------------------------
       导出 JSON（features + flow）
    ------------------------------ */
    document.getElementById("exportBtn").onclick = () => {
        const data = {
            features: featureSchema,
            flow: flowModules
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json"
        });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "task_config.json";
        a.click();
    };

    /* ------------------------------
       导入 JSON（恢复 UI 状态）
    ------------------------------ */
    document.getElementById("importBtn").onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = e => {
            const reader = new FileReader();
            reader.onload = () => {
                const data = JSON.parse(reader.result);

                /* 恢复左侧功能区 */
                if (data.features) {
                    featureSchema = data.features;
                    renderFeaturePanel();
                }

                /* 恢复右侧 Flow */
                if (data.flow) {
                    flowModules = data.flow;
                    renderFlowList();
                }

                alert("导入成功");
            };

            reader.readAsText(e.target.files[0]);
        };

        input.click();
    };
}

/* ============================================================
   模块选择器（Flow 模块添加）
============================================================ */
function openModulePicker() {
    const picker = document.getElementById("modulePicker");
    const list = document.getElementById("modulePickerList");

    list.innerHTML = "";

    loadedModuleDefs.forEach(def => {
        const item = document.createElement("div");
        item.className = "flow-item";
        item.style.cursor = "pointer";

        const icon = document.createElement("span");
        icon.textContent = getModuleIcon(def.moduleName);
        icon.style.fontSize = "20px";
        icon.style.marginRight = "6px";

        const title = document.createElement("span");
        title.textContent = def.moduleDispalyName || def.moduleName;

        item.appendChild(icon);
        item.appendChild(title);

        item.onclick = () => {
            const newModule = JSON.parse(JSON.stringify(def));
            newModule.__open = false; // 默认折叠
            flowModules.push(newModule);
            picker.classList.add("hidden");
            renderFlowList();
        };

        list.appendChild(item);
    });

    picker.classList.remove("hidden");
}

/* ============================================================
   初始化完成
============================================================ */
console.log("app.js 已加载（全部 5 段完成）");
