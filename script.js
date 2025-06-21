document.addEventListener('DOMContentLoaded', function() {
    // 检测移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 如果是移动设备，添加一些移动优化
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }

    // 获取标签页元素
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 标签页切换功能
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有tab的active类
            tabBtns.forEach(b => b.classList.remove('active'));
            // 添加当前tab的active类
            this.classList.add('active');
            
            // 隐藏所有内容
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // 显示当前选中的内容，但不触发滚动
            const tabId = this.getAttribute('data-tab');
            const currentContent = document.getElementById(`${tabId}-content`);
            currentContent.style.display = 'block';
            
            // 添加动画效果，但不改变滚动位置
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateY(10px)';
            setTimeout(() => {
                currentContent.style.opacity = '1';
                currentContent.style.transform = 'translateY(0)';
            }, 10);
            
            // 不触发滚动，保持当前滚动位置
        });
    });
    
    // ==================== IPDB API 功能 ====================
    
    // 获取IPDB相关元素
    const queryBtn = document.getElementById('queryBtn');
    const result = document.getElementById('result');
    const loading = document.getElementById('loading');
    const downloadFileCheckbox = document.getElementById('downloadFile');
    const useProxyCheckbox = document.getElementById('useProxy');
    const proxySettings = document.getElementById('proxySettings');
    const downloadSettings = document.getElementById('downloadSettings');
    const customProxyInput = document.getElementById('customProxyInput');
    const customProxyUrl = document.getElementById('customProxyUrl');
    const ipTypeCheckboxes = document.querySelectorAll('input[name="ipType"]');
    const proxyTypeRadios = document.querySelectorAll('input[name="proxyType"]');
    const downloadTypeRadios = document.querySelectorAll('input[name="downloadType"]');
    
    // 显示/隐藏代理设置
    useProxyCheckbox.addEventListener('change', function() {
        proxySettings.style.display = this.checked ? 'block' : 'none';
    });
    
    // 显示/隐藏下载设置
    downloadFileCheckbox.addEventListener('change', function() {
        downloadSettings.style.display = this.checked ? 'block' : 'none';
    });
    
    // 显示/隐藏自定义代理输入框
    proxyTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            customProxyInput.style.display = this.value === 'custom' ? 'block' : 'none';
        });
    });
    
    // 使用代理获取数据
    async function fetchWithProxy(url, proxyType, customProxy) {
        let proxyUrl;
        
        switch (proxyType) {
            case 'cors-anywhere':
                proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
                return fetch(proxyUrl, {
                    headers: {
                        'Origin': window.location.origin,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }).then(response => {
                    if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
                    return response.text();
                });
                
            case 'allorigins':
                proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                return fetch(proxyUrl).then(response => {
                    if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
                    return response.text();
                });
                
            case 'custom':
                // 使用自定义代理
                if (customProxy.includes('{target}')) {
                    proxyUrl = customProxy.replace('{target}', encodeURIComponent(url));
                } else {
                    proxyUrl = customProxy + encodeURIComponent(url);
                }
                return fetch(proxyUrl).then(response => {
                    if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
                    return response.text();
                });
                
            default:
                throw new Error('未知的代理类型');
        }
    }
    
    // 获取IP详细信息（使用ip-api）
    async function getIPDetails(ip, retryCount = 0) {
        const maxRetries = 1; // 减少重试次数，提高速度
        
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    country: data.country || '未知',
                    countryCode: data.countryCode || '未知',
                    region: data.regionName || '未知',
                    city: data.city || '未知',
                    zip: data.zip || '未知',
                    lat: data.lat || '未知',
                    lon: data.lon || '未知',
                    timezone: data.timezone || '未知',
                    isp: data.isp || '未知',
                    org: data.org || '未知',
                    as: data.as || '未知',
                    mobile: data.mobile ? '是' : '否',
                    proxy: data.proxy ? '是' : '否',
                    hosting: data.hosting ? '是' : '否'
                };
            } else {
                throw new Error(data.message || '查询失败');
            }
        } catch (error) {
            console.warn(`获取IP ${ip} 详细信息失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error.message);
            
            // 只对频率限制错误进行重试，减少不必要的延迟
            if ((error.message.includes('429') || error.message.includes('rate limit')) && retryCount < maxRetries) {
                const delay = 500; // 减少重试延迟到500ms
                await new Promise(resolve => setTimeout(resolve, delay));
                return getIPDetails(ip, retryCount + 1);
            }
            
            return null;
        }
    }
    
    // 并发查询IP详细信息
    async function getIPDetailsBatch(ips, batchSize = 3) {
        const results = [];
        const batches = [];
        
        // 将IP分批
        for (let i = 0; i < ips.length; i += batchSize) {
            batches.push(ips.slice(i, i + batchSize));
        }
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            // 并发查询当前批次的IP
            const batchPromises = batch.map(ip => getIPDetails(ip));
            const batchResults = await Promise.allSettled(batchPromises);
            
            // 处理结果
            batchResults.forEach((result, index) => {
                const ip = batch[index];
                if (result.status === 'fulfilled' && result.value) {
                    results.push({ ip, details: result.value, success: true });
                } else {
                    results.push({ ip, details: null, success: false });
                }
            });
            
            // 批次间短暂延迟，避免频率限制
            if (batchIndex < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 20)); // 减少到20ms
            }
        }
        
        return results;
    }
    
    // 格式化IP详细信息
    function formatIPDetails(ip, details) {
        if (!details) {
            return `<tr><td colspan="2">${ip} [详细信息获取失败]</td></tr>`;
        }
        
        return `<tr>
            <td><strong>IP地址</strong></td>
            <td>${ip}</td>
        </tr>
        <tr>
            <td><strong>国家/地区</strong></td>
            <td>${details.country} (${details.countryCode})</td>
        </tr>
        <tr>
            <td><strong>省份</strong></td>
            <td>${details.region}</td>
        </tr>
        <tr>
            <td><strong>城市</strong></td>
            <td>${details.city}</td>
        </tr>
        <tr>
            <td><strong>邮编</strong></td>
            <td>${details.zip}</td>
        </tr>
        <tr>
            <td><strong>坐标</strong></td>
            <td>${details.lat}, ${details.lon}</td>
        </tr>
        <tr>
            <td><strong>时区</strong></td>
            <td>${details.timezone}</td>
        </tr>
        <tr>
            <td><strong>ISP</strong></td>
            <td>${details.isp}</td>
        </tr>
        <tr>
            <td><strong>组织</strong></td>
            <td>${details.org}</td>
        </tr>
        <tr>
            <td><strong>AS</strong></td>
            <td>${details.as}</td>
        </tr>
        <tr>
            <td><strong>移动网络</strong></td>
            <td>${details.mobile}</td>
        </tr>
        <tr>
            <td><strong>代理</strong></td>
            <td>${details.proxy}</td>
        </tr>
        <tr>
            <td><strong>托管服务</strong></td>
            <td>${details.hosting}</td>
        </tr>`;
    }
    
    // 创建并下载文件
    function downloadTextAsFile(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
    }
    
    // 将HTML表格转换为纯文本格式
    function convertHTMLToText(html) {
        // 创建临时div来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        let text = '';
        
        // 处理IP详细信息表格
        const sections = tempDiv.querySelectorAll('.ip-details-section');
        if (sections.length > 0) {
            sections.forEach(section => {
                const title = section.querySelector('h4');
                if (title) {
                    text += title.textContent + '\n';
                    text += '='.repeat(title.textContent.length) + '\n\n';
                }
                
                const table = section.querySelector('.ip-details-table');
                if (table) {
                    // 检查是否有表头（简略信息表格）
                    const thead = table.querySelector('thead');
                    if (thead) {
                        // 简略信息表格：显示表头
                        const headerRow = thead.querySelector('tr');
                        if (headerRow) {
                            const headers = headerRow.querySelectorAll('th');
                            const headerTexts = Array.from(headers).map(th => th.textContent.trim());
                            text += headerTexts.join(' | ') + '\n';
                            text += '-'.repeat(headerTexts.join(' | ').length) + '\n';
                        }
                    }
                    
                    // 处理表格行
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            if (thead) {
                                // 简略信息：IP | 国家/地区 格式
                                const values = Array.from(cells).map(td => td.textContent.trim());
                                text += values.join(' | ') + '\n';
                            } else {
                                // 详细信息：标签: 值 格式
                                const label = cells[0].textContent.trim();
                                const value = cells[1].textContent.trim();
                                text += `${label}: ${value}\n`;
                            }
                        }
                    });
                }
                text += '\n';
            });
            
            // 处理表格之外的其他内容（纯文本部分）
            // 移除所有表格部分，获取剩余的纯文本内容
            const tempDivForText = document.createElement('div');
            tempDivForText.innerHTML = html;
            
            // 移除所有表格部分
            const allSections = tempDivForText.querySelectorAll('.ip-details-section');
            allSections.forEach(section => section.remove());
            
            // 获取剩余的纯文本内容
            const remainingText = tempDivForText.textContent || tempDivForText.innerText || '';
            if (remainingText.trim()) {
                text += remainingText.trim();
            }
        } else {
            // 如果没有表格，直接提取文本内容
            text = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        return text.trim();
    }
    
    // 查询按钮点击事件
    queryBtn.addEventListener('click', async function() {
        // 获取选中的IP类型
        const selectedTypes = [];
        ipTypeCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedTypes.push(checkbox.value);
            }
        });
        
        // 验证至少选择了一种IP类型
        if (selectedTypes.length === 0) {
            alert('请至少选择一种IP类型！');
            return;
        }
        
        // 验证自定义代理URL格式
        let customProxy = '';
        if (useProxyCheckbox.checked) {
            const selectedProxyType = document.querySelector('input[name="proxyType"]:checked').value;
            if (selectedProxyType === 'custom') {
                customProxy = customProxyUrl.value.trim();
                if (customProxy && !customProxy.includes('{target}') && !customProxy.endsWith('/')) {
                    customProxy += '/';
                }
                if (!customProxy) {
                    alert('请输入自定义代理URL');
                    return;
                }
            }
        }
        
        // 显示加载中
        loading.style.display = 'block';
        result.textContent = '';
        
        // 创建IP类型映射
        const typeMapping = {
            'cfv4': 'Cloudflare IPv4 地址列表',
            'cfv6': 'Cloudflare IPv6 地址列表',
            'proxy': 'Cloudflare 反代 IP 地址列表',
            'bestcf': '优选 Cloudflare 官方 IP',
            'bestproxy': '优选 Cloudflare 反代 IP'
        };
        
        let formattedResult = '';
        let hasError = false;
        let errorMessage = '';
        let typeResults = {}; // 存储每种类型的结果
        
        // 获取是否显示IP详细信息和简略信息
        const showIPDetailsCheckbox = document.getElementById('showIPDetails');
        const showIPDetails = showIPDetailsCheckbox && showIPDetailsCheckbox.checked;
        const showSimpleInfoCheckbox = document.getElementById('showSimpleInfo');
        const showSimpleInfo = showSimpleInfoCheckbox && showSimpleInfoCheckbox.checked;
        
        try {
            // 为每种选择的类型单独发起请求
            for (const type of selectedTypes) {
                try {
                    // 构建单类型API URL
                    const baseUrl = 'https://ipdb.api.030101.xyz/';
                    const downloadParam = 'false'; // 不下载文件
                    
                    const url = `${baseUrl}?type=${type}&down=${downloadParam}`;
                    
                    // 根据是否使用代理决定请求方式
                    let data;
                    if (useProxyCheckbox.checked) {
                        // 使用选择的代理方式
                        const selectedProxyType = document.querySelector('input[name="proxyType"]:checked').value;
                        data = await fetchWithProxy(url, selectedProxyType, customProxy);
                    } else {
                        // 直接请求API
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP错误: ${response.status}`);
                        }
                        data = await response.text();
                    }
                    
                    // 存储每种类型的结果
                    typeResults[type] = data.trim();
                    
                    // 只有当有数据时才添加类型标题
                    if (data && data.trim()) {
                        const typeDisplayName = typeMapping[type] || type;
                        let processedData = data.trim();
                        
                        // 如果需要显示IP详细信息
                        if (showIPDetails) {
                            // 检查是否选择了允许显示详细信息的IP类型
                            const allowedTypes = ['bestcf', 'bestproxy'];
                            const hasAllowedType = selectedTypes.some(type => allowedTypes.includes(type));
                            
                            if (!hasAllowedType) {
                                // 如果没有选择允许的类型，显示提示信息
                                processedData = `【${typeDisplayName}】:\n${processedData}\n\n⚠️ 提示：只有选择"优选 Cloudflare 官方 IP"或"优选 Cloudflare 反代 IP"才能显示IP详细信息`;
                            } else {
                                // 检查当前类型是否允许显示详细信息
                                const isCurrentTypeAllowed = allowedTypes.includes(type);
                                
                                if (!isCurrentTypeAllowed) {
                                    // 当前类型不允许，但整体有允许的类型，只显示原始数据，不显示提示
                                    processedData = `【${typeDisplayName}】:\n${processedData}`;
                                } else {
                                    const ips = processedData.split('\n').filter(line => line.trim());
                                    const detailedIPs = [];
                                    let successCount = 0;
                                    let failCount = 0;
                                    
                                    // 显示进度信息
                                    loading.textContent = `正在查询 ${typeDisplayName} 的IP详细信息...`;
                                    
                                    // 过滤出有效的IP地址
                                    const validIPs = ips.filter(ip => ip.trim() && !ip.startsWith('【'));
                                    
                                    if (validIPs.length > 0) {
                                        // 使用并发查询
                                        const batchResults = await getIPDetailsBatch(validIPs, 3);
                                        
                                        // 处理结果
                                        let ipIndex = 0;
                                        for (let i = 0; i < ips.length; i++) {
                                            const line = ips[i].trim();
                                            if (line && !line.startsWith('【')) {
                                                const result = batchResults[ipIndex];
                                                if (result && result.success) {
                                                    detailedIPs.push(formatIPDetails(result.ip, result.details));
                                                    successCount++;
                                                } else {
                                                    detailedIPs.push(`<tr><td colspan="2">${result ? result.ip : line} [详细信息获取失败]</td></tr>`);
                                                    failCount++;
                                                }
                                                ipIndex++;
                                            } else {
                                                detailedIPs.push(line);
                                            }
                                        }
                                    } else {
                                        // 没有有效IP，直接添加原始内容
                                        detailedIPs.push(...ips);
                                    }
                                    
                                    // 生成HTML表格
                                    const tableHTML = `<div class="ip-details-section">
                                        <h4>${typeDisplayName} (成功: ${successCount}, 失败: ${failCount})</h4>
                                        <table class="ip-details-table">
                                            <tbody>
                                                ${detailedIPs.join('')}
                                            </tbody>
                                        </table>
                                    </div>`;
                                    processedData = tableHTML;
                                }
                            }
                        } else if (showSimpleInfo) {
                            // 检查是否选择了允许显示详细信息的IP类型
                            const allowedTypes = ['bestcf', 'bestproxy'];
                            const hasAllowedType = selectedTypes.some(type => allowedTypes.includes(type));
                            
                            if (!hasAllowedType) {
                                // 如果没有选择允许的类型，显示提示信息
                                processedData = `【${typeDisplayName}】:\n${processedData}\n\n⚠️ 提示：只有选择"优选 Cloudflare 官方 IP"或"优选 Cloudflare 反代 IP"才能显示IP简略信息`;
                            } else {
                                // 检查当前类型是否允许显示详细信息
                                const isCurrentTypeAllowed = allowedTypes.includes(type);
                                
                                if (!isCurrentTypeAllowed) {
                                    // 当前类型不允许，但整体有允许的类型，只显示原始数据，不显示提示
                                    processedData = `【${typeDisplayName}】:\n${processedData}`;
                                } else {
                                    // 简略信息：只显示IP和国家
                                    const ips = processedData.split('\n').filter(line => line.trim());
                                    const simpleRows = [];
                                    let successCount = 0;
                                    let failCount = 0;
                                    
                                    loading.textContent = `正在查询 ${typeDisplayName} 的IP简略信息...`;
                                    
                                    // 过滤出有效的IP地址
                                    const validIPs = ips.filter(ip => ip.trim() && !ip.startsWith('【'));
                                    
                                    if (validIPs.length > 0) {
                                        // 使用并发查询
                                        const batchResults = await getIPDetailsBatch(validIPs, 3);
                                        
                                        // 处理结果
                                        let ipIndex = 0;
                                        for (let i = 0; i < ips.length; i++) {
                                            const line = ips[i].trim();
                                            if (line && !line.startsWith('【')) {
                                                const result = batchResults[ipIndex];
                                                if (result && result.success) {
                                                    simpleRows.push(`<tr><td>${result.ip}</td><td>${result.details.country} (${result.details.countryCode})</td></tr>`);
                                                    successCount++;
                                                } else {
                                                    simpleRows.push(`<tr><td>${result ? result.ip : line}</td><td>获取失败</td></tr>`);
                                                    failCount++;
                                                }
                                                ipIndex++;
                                            }
                                        }
                                    }
                                    
                                    processedData = `<div class=\"ip-details-section\"><h4>${typeDisplayName}（简略信息）(成功: ${successCount}, 失败: ${failCount})</h4><table class=\"ip-details-table\"><thead><tr><th>IP地址</th><th>国家/地区</th></tr></thead><tbody>${simpleRows.join('')}</tbody></table></div>`;
                                }
                            }
                        } else {
                            // 不显示详细信息时，保持原来的文本格式
                            processedData = `【${typeDisplayName}】:\n${processedData}`;
                        }
                        
                        formattedResult += processedData + '\n\n';
                    }
                } catch (error) {
                    throw error; // 将错误传递到外部try-catch
                }
            }
            
            // 显示结果
            if (showIPDetails || showSimpleInfo) {
                result.innerHTML = formattedResult.trim();
            } else {
            result.textContent = formattedResult.trim();
            }
            
            // 更新IP数量统计
            const ipCount = countIPs(formattedResult);
            updateResultCount(ipCount);
        } catch (error) {
            // 处理错误
            hasError = true;
            errorMessage = error.message;
            
            if (useProxyCheckbox.checked) {
                result.textContent = `使用代理获取数据出错: ${errorMessage}\n\n可能的解决方法:\n1. 尝试更换其他代理方式\n2. 请确保您的网络可以正常访问API和代理服务`;
            } else {
                result.textContent = `获取数据出错: ${errorMessage}\n\n可能的解决方法:\n1. 勾选"使用代理解决跨域问题"选项\n2. 请确保您的网络可以正常访问API`;
            }
            
            // 清空IP数量统计
            updateResultCount(0);
        } finally {
            // 隐藏加载中
            loading.style.display = 'none';
            
            // 如果是下载文件模式
            if (downloadFileCheckbox.checked && !hasError) {
                const downloadType = document.querySelector('input[name="downloadType"]:checked').value;
                
                if (downloadType === 'single') {
                    // 单个合并文件下载 - 使用破折号连接所有IP类型，不显示日期
                    const typeNames = selectedTypes.join('-');
                    
                    // 检查是否包含HTML表格，如果是则转换为纯文本
                    let downloadContent;
                    if (showIPDetails || showSimpleInfo) {
                        downloadContent = convertHTMLToText(formattedResult);
                    } else {
                        downloadContent = formattedResult.trim();
                    }
                    
                    downloadTextAsFile(`${typeNames}.txt`, downloadContent);
                } else {
                    // 多个独立文件下载 - 每个文件名就是对应IP类型
                    for (const type of selectedTypes) {
                        if (typeResults[type] && typeResults[type].length > 0) {
                            const typeDisplayName = typeMapping[type] || type;
                            let downloadContent = '';
                            
                            // 如果需要显示IP详细信息或简略信息
                            if (showIPDetails || showSimpleInfo) {
                                // 检查当前类型是否允许显示详细信息
                                const allowedTypes = ['bestcf', 'bestproxy'];
                                const isCurrentTypeAllowed = allowedTypes.includes(type);
                                
                                if (isCurrentTypeAllowed) {
                                    // 优选类型：需要处理HTML表格
                                    // 从formattedResult中提取对应类型的内容
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = formattedResult;
                                    
                                    // 查找对应类型的表格
                                    const sections = tempDiv.querySelectorAll('.ip-details-section');
                                    let foundSection = false;
                                    
                                    sections.forEach(section => {
                                        const title = section.querySelector('h4');
                                        if (title && title.textContent.includes(typeDisplayName)) {
                                            // 转换这个表格为文本
                                            downloadContent = convertHTMLToText(section.outerHTML);
                                            foundSection = true;
                                        }
                                    });
                                    
                                    // 如果没有找到对应的表格，使用原始数据
                                    if (!foundSection) {
                                        downloadContent = `【${typeDisplayName}】:\n${typeResults[type]}`;
                                    }
                                } else {
                                    // 非优选类型：显示原始数据
                                    downloadContent = `【${typeDisplayName}】:\n${typeResults[type]}`;
                                }
                            } else {
                                // 不显示详细信息时，添加类型标题
                                downloadContent = `【${typeDisplayName}】:\n${typeResults[type]}`;
                            }
                            
                            downloadTextAsFile(`${type}.txt`, downloadContent);
                        }
                    }
                }
            }
        }
    });
    
    // ==================== Spurl API 功能 ====================
    
    // 获取Spurl相关元素
    const downloadSizeInput = document.getElementById('downloadSize');
    const sizeUnitSelect = document.getElementById('sizeUnit');
    const showProgressCheckbox = document.getElementById('showProgressSpurl');
    const startSpeedTestBtn = document.getElementById('startSpeedTest');
    const stopSpeedTestBtn = document.getElementById('stopSpeedTest');
    const progressContainer = document.querySelector('.progress-container');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const downloadUrl = document.getElementById('downloadUrl');
    const fileSize = document.getElementById('fileSize');
    const downloadSpeed = document.getElementById('downloadSpeed');
    const downloadTime = document.getElementById('downloadTime');
    
    // 存储下载控制器和开始时间
    let downloadController = null;
    let downloadStartTime = null;
    let downloadTotalBytes = 0;
    let downloadedBytes = 0;
    let downloadInterval = null;
    
    // 开始测速按钮点击事件
    startSpeedTestBtn.addEventListener('click', function() {
        const size = downloadSizeInput.value;
        const unit = sizeUnitSelect.value;
        
        if (!size || size <= 0) {
            alert('请输入有效的下载大小');
            return;
        }
        
        // 构建Spurl API URL
        const apiUrl = `https://spurl.api.030101.xyz/${size}${unit}`;
        
        // 更新UI
        downloadUrl.textContent = apiUrl;
        fileSize.textContent = formatSize(calculateBytes(size, unit));
        downloadSpeed.textContent = '测试中...';
        downloadTime.textContent = '测试中...';
        
        // 显示进度条（如果选择了显示进度）
        if (showProgressCheckbox.checked) {
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        } else {
            progressContainer.style.display = 'none';
        }
        
        // 显示停止按钮，隐藏开始按钮
        startSpeedTestBtn.style.display = 'none';
        stopSpeedTestBtn.style.display = 'inline-block';
        
        // 开始下载测试
        startDownloadTest(apiUrl);
    });
    
    // 停止测速按钮点击事件
    stopSpeedTestBtn.addEventListener('click', function() {
        if (downloadController) {
            downloadController.abort();
            stopDownloadTest();
        }
    });
    
    // 开始下载测试
    function startDownloadTest(url) {
        // 重置状态
        downloadStartTime = Date.now();
        downloadedBytes = 0;
        downloadTotalBytes = calculateBytes(downloadSizeInput.value, sizeUnitSelect.value);
        
        // 创建AbortController用于取消下载
        downloadController = new AbortController();
        
        // 创建读取器，用于处理流式下载
        fetch(url, { signal: downloadController.signal })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误: ${response.status}`);
                }
                
                // 获取流读取器
                const reader = response.body.getReader();
                
                // 开始进度更新定时器
                if (showProgressCheckbox.checked) {
                    downloadInterval = setInterval(updateDownloadProgress, 200);
                }
                
                // 递归读取数据
                function readStream() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            // 下载完成
                            finishDownloadTest();
                            return;
                        }
                        
                        // 更新已下载字节数
                        downloadedBytes += value.length;
                        
                        // 继续读取
                        return readStream();
                    });
                }
                
                return readStream();
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    downloadSpeed.textContent = '测试已取消';
                    downloadTime.textContent = '测试已取消';
                } else {
                    downloadSpeed.textContent = '测试失败';
                    downloadTime.textContent = '测试失败';
                    alert(`下载测试出错: ${error.message}`);
                }
                
                stopDownloadTest();
            });
    }
    
    // 更新下载进度
    function updateDownloadProgress() {
        if (downloadTotalBytes > 0) {
            const percent = Math.min(100, Math.round((downloadedBytes / downloadTotalBytes) * 100));
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;
            
            // 计算实时速度
            const elapsedSeconds = (Date.now() - downloadStartTime) / 1000;
            if (elapsedSeconds > 0) {
                const bps = downloadedBytes / elapsedSeconds;
                downloadSpeed.textContent = formatSpeed(bps);
                downloadTime.textContent = formatTime(elapsedSeconds);
            }
        }
    }
    
    // 完成下载测试
    function finishDownloadTest() {
        const endTime = Date.now();
        const totalTime = (endTime - downloadStartTime) / 1000; // 转换为秒
        
        // 计算下载速度
        const bps = downloadedBytes / totalTime;
        
        // 更新UI
        downloadSpeed.textContent = formatSpeed(bps);
        downloadTime.textContent = formatTime(totalTime);
        
        if (showProgressCheckbox.checked) {
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
        }
        
        stopDownloadTest();
    }
    
    // 停止下载测试
    function stopDownloadTest() {
        // 清除定时器
        if (downloadInterval) {
            clearInterval(downloadInterval);
            downloadInterval = null;
        }
        
        // 重置控制器
        downloadController = null;
        
        // 恢复按钮状态
        startSpeedTestBtn.style.display = 'inline-block';
        stopSpeedTestBtn.style.display = 'none';
    }
    
    // ==================== 通用辅助函数 ====================
    
    // 计算字节数
    function calculateBytes(size, unit) {
        const sizeNum = parseFloat(size);
        switch(unit) {
            case 'kb': return sizeNum * 1024;
            case 'mb': return sizeNum * 1024 * 1024;
            case 'gb': return sizeNum * 1024 * 1024 * 1024;
            default: return sizeNum;
        }
    }
    
    // 格式化文件大小
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    
    // 格式化速度
    function formatSpeed(bps) {
        if (bps < 1024) return bps.toFixed(2) + ' B/s';
        if (bps < 1024 * 1024) return (bps / 1024).toFixed(2) + ' KB/s';
        if (bps < 1024 * 1024 * 1024) return (bps / (1024 * 1024)).toFixed(2) + ' MB/s';
        return (bps / (1024 * 1024 * 1024)).toFixed(2) + ' GB/s';
    }
    
    // 格式化时间
    function formatTime(seconds) {
        if (seconds < 60) return seconds.toFixed(2) + ' 秒';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes} 分 ${remainingSeconds.toFixed(2)} 秒`;
    }
    
    // 为API类型选项添加鼠标悬停效果
    const ipTypeLabels = document.querySelectorAll('.checkbox-group label');
    ipTypeLabels.forEach(label => {
        label.title = label.textContent.trim();
    });
    
    // 统计IP数量
    function countIPs(text) {
        if (!text) return 0;
        
        let count = 0;
        
        // 检查是否包含HTML表格（IP详细信息或简略信息模式）
        if (text.includes('<table') || text.includes('<div class="ip-details-section"')) {
            // 创建临时div来解析HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            
            // 查找所有IP详细信息表格
            const sections = tempDiv.querySelectorAll('.ip-details-section');
            sections.forEach(section => {
                const table = section.querySelector('.ip-details-table');
                if (table) {
                    // 检查是否有表头（简略信息表格）
                    const thead = table.querySelector('thead');
                    if (thead) {
                        // 简略信息表格：计算tbody中的行数
                        const tbody = table.querySelector('tbody');
                        if (tbody) {
                            const rows = tbody.querySelectorAll('tr');
                            count += rows.length;
                        }
                    } else {
                        // 详细信息表格：计算包含"IP地址"标签的行数
                        const rows = table.querySelectorAll('tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2) {
                                const firstCell = cells[0].textContent.trim();
                                // 只统计包含"IP地址"标签的行，避免重复计算
                                if (firstCell === 'IP地址') {
                                    count++;
                                }
                            }
                        });
                    }
                }
            });
            
            // 移除所有HTML表格部分，获取剩余的纯文本内容
            const tempDivForText = document.createElement('div');
            tempDivForText.innerHTML = text;
            
            // 移除所有表格部分
            const allSections = tempDivForText.querySelectorAll('.ip-details-section');
            allSections.forEach(section => section.remove());
            
            // 获取剩余的纯文本内容并统计
            const remainingText = tempDivForText.textContent || tempDivForText.innerText || '';
            if (remainingText.trim()) {
                const lines = remainingText.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    // 跳过空行、类型标题、提示行、分隔行
                    if (
                        trimmed &&
                        !trimmed.startsWith('【') &&
                        !trimmed.startsWith('⚠️') &&
                        !trimmed.endsWith('：') && // 注意是中文冒号
                        !trimmed.endsWith(':')
                    ) {
                        count++;
                    }
                }
            }
        } else {
            // 纯文本格式
            const lines = text.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (
                    trimmed &&
                    !trimmed.startsWith('【') &&
                    !trimmed.startsWith('⚠️') &&
                    !trimmed.endsWith('：') &&
                    !trimmed.endsWith(':')
                ) {
                    count++;
                }
            }
        }
        return count;
    }
    
    // 更新结果数量统计
    function updateResultCount(count) {
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = count > 0 ? `(共 ${count} 个IP)` : '';
        }
    }

    // 美化界面交互效果
    function enhanceUI() {
        // 按钮点击波纹效果
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // 为标签添加渐变过渡效果
        const labels = document.querySelectorAll('.checkbox-group label, .radio-group label');
        labels.forEach(label => {
            label.addEventListener('mouseenter', function() {
                this.style.transition = 'all 0.3s ease';
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            });
            
            label.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });
        
        // 动态调整背景气泡
        const bubbles = document.querySelectorAll('.bg-bubbles li');
        window.addEventListener('resize', function() {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            bubbles.forEach((bubble, index) => {
                const randomLeft = Math.random() * windowWidth;
                bubble.style.left = `${randomLeft}px`;
                bubble.style.animationDuration = `${15 + Math.random() * 10}s`;
                bubble.style.animationDelay = `${index * 0.2}s`;
            });
        });
        
        // 触发一次resize事件来初始化气泡位置
        window.dispatchEvent(new Event('resize'));
    }
    
    // 滑动效果优化
    function optimizeScrollEffects() {
        // 为所有可滚动元素添加性能优化
        document.querySelectorAll('.tab-content, pre, .result-container').forEach(content => {
            // 使用CSS硬件加速
            content.style.willChange = 'transform';
            content.style.transform = 'translateZ(0)';
            
            // 减少滚动事件的触发频率
            let scrollTimeout;
            content.addEventListener('scroll', function() {
                if (!scrollTimeout) {
                    scrollTimeout = setTimeout(() => {
                        scrollTimeout = null;
                    }, 100);
                }
            }, { passive: true });
        });
        
        // 平滑显示结果区域，但不触发滚动
        const resultContainer = document.querySelector('.result-container');
        if (resultContainer) {
            // 使用Intersection Observer API更高效地检测可见性
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 使用requestAnimationFrame优化动画性能
                        requestAnimationFrame(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        });
                    }
                });
            }, { 
                threshold: 0.1,
                rootMargin: '20px'
            });
            
            resultContainer.style.opacity = '0';
            resultContainer.style.transform = 'translateY(20px)';
            resultContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            observer.observe(resultContainer);
        }
    }
    
    // 初始化美化效果
    enhanceUI();
    // 初始化滑动效果优化
    optimizeScrollEffects();
    
    // 返回顶部按钮
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        // 监听滚动事件，控制按钮显示/隐藏
        let scrollThrottleTimer;
        window.addEventListener('scroll', function() {
            // 使用节流技术减少滚动事件处理频率
            if (!scrollThrottleTimer) {
                scrollThrottleTimer = setTimeout(() => {
                    if (window.scrollY > 300) {
                        backToTopBtn.classList.add('visible');
                    } else {
                        backToTopBtn.classList.remove('visible');
                    }
                    scrollThrottleTimer = null;
                }, 100);
            }
        }, { passive: true });
        
        // 点击返回顶部，使用简单的滚动
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 让显示IP简略信息和显示IP详细信息互斥
    const showIPDetailsCheckbox = document.getElementById('showIPDetails');
    const showSimpleInfoCheckbox = document.getElementById('showSimpleInfo');
    if (showIPDetailsCheckbox && showSimpleInfoCheckbox) {
        showIPDetailsCheckbox.addEventListener('change', function() {
            if (this.checked) showSimpleInfoCheckbox.checked = false;
        });
        showSimpleInfoCheckbox.addEventListener('change', function() {
            if (this.checked) showIPDetailsCheckbox.checked = false;
        });
    }
});
