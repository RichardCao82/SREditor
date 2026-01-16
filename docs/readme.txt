你给出的需求量非常大，而且结构清晰、功能复杂，已经接近一个完整的前端应用规格文档了。为了让你能真正落地，我整理出一个**专业级静态网页架构设计 + 完整文件结构 + 关键组件设计 + JSON 数据结构定义 + 前端实现思路**。  
你可以直接用它作为项目蓝图，随后我也可以继续为你生成**完整 HTML/CSS/JS 模板代码**。

---

# 🌐 静态网页总体设计（专业级）

页面分为左右两栏：

```
+--------------------------------------------------------------+
| 导入按钮 | 导出按钮                                          |
+---------------------------+----------------------------------+
| 左侧功能区（功能选择）    | 右侧 Flow 模块编辑区             |
|                           |                                  |
|                           |                                  |
+---------------------------+----------------------------------+
```

---

# 📁 项目文件结构（静态网页）

```
/project-root
│── index.html
│── style.css
│── app.js
│── /components
│     ├── feature-panel.js
│     ├── flow-editor.js
│     ├── module-dialog.js
│── /data
│     ├── feature-schema.json   ← 左侧功能区的 JSON 定义
│     ├── flow-modules-sample.json
```

---

# 🧩 左侧功能区：功能 JSON 格式定义（你要求我定义）

为了让网页能导入/导出，我为左侧功能区定义一个**标准 JSON Schema**：

```json
{
  "readBatteryInfo": {
    "enabled": true,
    "readBatteryHealthy": {
      "enabled": true,
      "readBatteryHealthyFromLog": false,
      "stopWhenPoor": false
    },
    "waitCharging": {
      "enabled": false,
      "targetPercent": 20,
      "maxWaitMinutes": 20
    }
  },

  "readReplaceComponents": {
    "enabled": false,
    "stopWhenFound": false
  },

  "powerOffAtEnd": false,
  "activeDeviceAtEnd": false,

  "skipWelcomeScreen": {
    "enabled": false,
    "skipTo": "FFFFFFFFFFFFFFFF"
  },

  "readSdCard": {
    "enabled": true,
    "stopWhenFound": false
  },

  "readSimCard": {
    "enabled": true,
    "stopWhenFound": false
  },

  "readEsimCard": {
    "enabled": true,
    "stopWhenFound": false
  },

  "readFMI": {
    "enabled": true,
    "query3rd": {
      "enabled": false,
      "useForensic": false,
      "useProlog": false,
      "useEcoATM": false
    },
    "stopWhenLocked": false
  },

  "removeGoogleAccount": true,

  "readFMM": {
    "enabled": true,
    "query3rd": {
      "enabled": false,
      "useSamsungApi": false
    },
    "stopWhenLocked": false
  },

  "readFRP": {
    "enabled": true,
    "query3rd": {
      "enabled": false,
      "useSamsungApi": false
    },
    "stopWhenLocked": false
  },

  "readKME": {
    "enabled": true,
    "stopWhenLocked": false
  },

  "readDEP": {
    "enabled": true,
    "mustRead": false,
    "stopWhenLocked": false
  },

  "checkSimLock": {
    "enabled": false,
    "query3rd": {
      "enabled": false,
      "useForensic": false,
      "useProlog": false,
      "useEcoATM": false
    },
    "stopWhenLocked": false
  },

  "checkStolen": {
    "enabled": false,
    "query3rd": {
      "enabled": false,
      "useRecipo": false,
      "useGSMA": false
    },
    "stopWhenLocked": false
  },

  "queryFinancialStatus": {
    "enabled": false,
    "query3rd": {
      "enabled": false,
      "useProlog": false,
      "useEcoATM": false
    }
  },

  "unlockCarrier": false,

  "readJapanNetworkRestriction": {
    "enabled": false,
    "stopWhenLocked": false
  },

  "readJapanCert": {
    "enabled": false,
    "stopWhenNotFound": false
  },

  "readFelica": {
    "enabled": false,
    "stopWhenFail": false
  }
}
```

这个 JSON 是**导入/导出格式**，网页加载后会自动填充 UI。

---

# 🧩 左侧功能区 UI 设计（专业组件）

每个功能组件包含：

- Switch（主开关）
- Checkbox（子选项）
- Textbox（输入框）
- Dropdown（百分比选择）
- Tooltip（帮助信息）

示例：

```
[ON ] read battery info   ⓘ 读取电池基本信息
    [ON ] read battery healthy   ⓘ 读取电池健康情况
        [ ] read battery healthy from log   ⓘ 需要40秒
        [ ] stop operation when poor        ⓘ 红色，立刻报错
    [OFF] stop operation and wait charging battery  ⓘ 等待充电
        (dropdown) target percent: 20%
        (textbox) max wait: 20 minutes
```

---

# 🧩 右侧 Flow 模块编辑区

## JSON 文件格式（你已经给出，我补充完整）

```json
[
  {
    "moduleName": "refurbish",
    "moduleDispalyName": "refurbish task",
    "description": "refurbish the device on a specific USB port",
    "dependence": "1. The device type information(iOS or Android) comes from the module getUsbInfo in the database. 2. android device, the fdbox723.apk already install by module installApps",
    "input": {
      "customDataTag": "iosRefurbishTask",
      "customizeIpsw": {
        "ipswFolder": "",
        "customizeIpsw": {}
      },
      "_customizeIpswSample": {
        "ipswFolder": "c:/dmg",
        "customizeIpsw": {
          "iPhone14,2": {
            "ipsw": "iPhone14,2_15.1.1_19B81_Restore.ipsw",
            "dmg": "018-98872-002.dmg"
          }
        }
      },
      "retryTimeWhenFail": "2",
      "retryInterval": "1",
      "moduleTimeout": "3600",
      "_comment": "1. timeout and retry, which will appear first and which will be used 2. _port parameter come from API interface"
    },
    "result_description": {
      "-1": "failure, exception",
      "0": "success",
      "1": "failure",
      "2": "not support android"
    }
  }
]
```

---

# 🧩 Flow 编辑区交互逻辑

### 1. 加载 JSON → 显示模块列表

### 2. 显示一个大 “+” 按钮

点击后：

```
+------------------------+
| refurbish task         |
| install apps           |
| get usb info           |
| ...                    |
+------------------------+
```

用户选择后：

```
[refurbish task]   +
```

继续点击 +：

```
[refurbish task] → [install apps]   +
```

### 3. 双击模块 → 弹出编辑对话框

对话框内容：

- moduleName（不可编辑）
- moduleDispalyName（不可编辑）
- description（不可编辑）
- dependence（不可编辑）
- result_description（不可编辑）
- input（可编辑，自动生成表格）

---

# 🧩 导入 / 导出按钮

### 导出内容格式（最终 JSON）

```json
{
  "features": { ... 左侧功能区 JSON ... },
  "flow": [
    {
      "moduleName": "refurbish",
      "input": { ... 用户编辑后的 input ... }
    },
    {
      "moduleName": "installApps",
      "input": { ... }
    }
  ]
}
```

导出时触发浏览器下载。

导入时解析 JSON，填充左侧功能区 + 右侧 flow。

---

# 🎁 如果你愿意，我可以继续为你生成：

### ✅ 完整可运行的 index.html  
### ✅ 完整的 style.css  
### ✅ 完整的 app.js（含事件绑定、JSON 导入导出、Flow 编辑器、模块对话框）  
### ✅ 所有 UI 组件（Switch、Checkbox、Tooltip、Dialog）  
### ✅ 一个可直接打开运行的静态网页 Demo  

---

如果你想继续，我可以问你一个关键问题：

## 你希望我生成的网页风格是：

1. **简洁白色风（类似 Apple）**  
2. **深色科技风（类似 VS Code）**  
3. **Material Design（类似 Google）**  
4. **Bootstrap 风格**  
5. **Tailwind 风格**  
6. **你自定义的风格**

告诉我你喜欢哪一种，我就开始生成完整代码。
