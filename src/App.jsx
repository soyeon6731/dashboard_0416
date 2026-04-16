import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Upload, BarChart2, TrendingUp, Award, Bot } from 'lucide-react';
import './App.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function App() {
  const [data, setData] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Analysis states
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [topProduct, setTopProduct] = useState({ name: '', revenue: 0 });
  const [productStats, setProductStats] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [agentReport, setAgentReport] = useState('');

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const parsedData = XLSX.utils.sheet_to_json(ws);
      
      analyzeData(parsedData);
    };
    reader.readAsBinaryString(file);
  };

  const analyzeData = (raw) => {
    if (!raw || raw.length === 0) return;

    let revenue = 0;
    let items = 0;
    const productMap = {};
    const monthlyMap = {};
    const regionMap = {};

    raw.forEach(row => {
      const pName = row['Product'] || row['product'] || 'Unknown';
      const rev = row['Total Revenue'] || row['Revenue'] || row['revenue'] || row['Price'] * row['Quantity'] || 0;
      const qty = row['Quantity'] || row['quantity'] || 1;
      const dateRaw = row['Date'] || row['date'];
      const regionMatch = row['Region'] || row['region'] || 'Unknown';

      revenue += Number(rev);
      items += Number(qty);

      // Product grouping
      if (!productMap[pName]) productMap[pName] = 0;
      productMap[pName] += Number(rev);

      // Region grouping
      if (!regionMap[regionMatch]) regionMap[regionMatch] = 0;
      regionMap[regionMatch] += Number(rev);

      // Monthly grouping
      if (dateRaw) {
        // Convert integer date to JS Date if Excel formatted
        let d = new Date(dateRaw);
        if(!isNaN(dateRaw) && typeof dateRaw === 'number') {
            d = new Date((dateRaw - (25567 + 2)) * 86400 * 1000);
        }
        
        if (!isNaN(d.getTime())) {
          const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyMap[monthYear]) monthlyMap[monthYear] = 0;
          monthlyMap[monthYear] += Number(rev);
        }
      }
    });

    // Formatting output
    setTotalRevenue(revenue);
    setTotalItems(items);

    const products = Object.keys(productMap).map(k => ({ name: k, revenue: productMap[k] }));
    products.sort((a, b) => b.revenue - a.revenue);
    setProductStats(products);

    if (products.length > 0) {
      setTopProduct(products[0]);
    }

    const trends = Object.keys(monthlyMap).map(k => ({ date: k, revenue: monthlyMap[k] }));
    trends.sort((a, b) => a.date.localeCompare(b.date));
    setMonthlyTrends(trends);

    const regions = Object.keys(regionMap).map(k => ({ name: k, value: regionMap[k] }));

    // Agent Report heuristics
    generateAgentReport(revenue, products, trends, regions);
    setData(raw);
  };

  const generateAgentReport = (rev, prods, trnd, regs) => {
    let report = `최신 데이터 분석 결과, 총 발생 매출은 $${rev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}입니다. `;
    
    if (prods.length > 0) {
      report += `가장 높은 판매고를 기록한 효자 상품은 **${prods[0].name}**이며, 단독으로 $${prods[0].revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}의 매출을 견인했습니다. `;
    }

    if (trnd.length > 1) {
      const firstMonth = trnd[0].revenue;
      const lastMonth = trnd[trnd.length - 1].revenue;
      if (lastMonth > firstMonth) {
        report += `전체 기간의 시작과 끝을 비교해 보았을 때 긍정적인 우상향 매출 추세를 보이고 있습니다. `;
      } else {
        report += `해당 기간의 후반부로 갈수록 매출이 눈에 띄게 감소했습니다. `;
      }
    }

    if (regs.length > 0) {
      const topReg = [...regs].sort((a, b) => b.value - a.value)[0];
      report += `지역별로는 **${topReg.name}** 지역이 시장을 압도적으로 선도하고 있습니다. `;
    }

    report += `향후 성장을 극대화하기 위해 판매율 1위 제품의 마케팅에 더욱 집중하고, 실적이 저조한 지역의 원인 분석 및 재검토를 권장합니다.`;
    setAgentReport(report);
  };

  return (
    <div className="container animate-fade-in">
      <header className="header">
        <h1 className="text-gradient">AI 영업 대시보드</h1>
        <p className="text-muted">엑셀 데이터를 업로드하면 즉시 AI 분석 결과를 보여줍니다.</p>
      </header>

      {!data ? (
        <div 
          className={`glass-panel upload-section ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload size={48} className="upload-icon" />
          <h3 style={{ marginBottom: "1rem" }}>여기로 엑셀 파일을 드래그 앤 드롭하세요</h3>
          <p className="text-muted" style={{ marginBottom: "2rem" }}>또는 클릭하여 내 컴퓨터에서 파일 찾기</p>
          <input 
            ref={fileInputRef} 
            type="file" 
            className="file-input" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleChange} 
          />
          <button className="btn btn-primary" onClick={onButtonClick}>파일 선택</button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Agent Insights Card */}
          <div className="glass-panel stat-card agent-report animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="agent-header">
              <Bot size={28} />
              <h2>AI 분석 리포트</h2>
            </div>
            <p className="agent-text" dangerouslySetInnerHTML={{__html: agentReport.replace(/\*\*(.*?)\*\*/g, '<strong><span class="text-gradient">$1</span></strong>') }}></p>
          </div>

          {/* Stat Cards */}
          <div className="glass-panel stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-title">총 매출</div>
            <div className="stat-value text-gradient">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          
          <div className="glass-panel stat-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-title">총 판매 수량</div>
            <div className="stat-value text-gradient">{totalItems.toLocaleString()}개</div>
          </div>

          <div className="glass-panel stat-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="stat-title">최고 매출 제품</div>
            <div className="stat-value text-gradient" style={{ fontSize: '2rem' }}>{topProduct.name}</div>
            <div className="stat-title" style={{ marginTop: '0.5rem' }}>${topProduct.revenue.toLocaleString()}</div>
          </div>

          {/* Charts */}
          <div className="glass-panel chart-card animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} className="text-muted"/> 월별 매출 추이</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(val) => '$' + (val/1000) + 'k'} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel chart-card animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} className="text-muted"/> 제품별 매출</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => '$' + (val/1000) + 'k'} />
                  <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {productStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{gridColumn: 'span 12', textAlign: 'center', marginTop: '2rem'}}>
             <button className="btn btn-primary" onClick={() => setData(null)}>새 데이터 업로드</button>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;
