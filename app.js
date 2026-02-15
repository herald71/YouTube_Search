/* ============================================================
   YouTube Search Pro - 메인 애플리케이션 로직
   유튜브 데이터 API v3를 활용한 검색 & 엑셀 다운로드
   ============================================================ */

// ===== 전역 변수 =====
let collectedVideos = [];   // 수집된 동영상 데이터 배열
let isSearching = false;    // 검색 진행 중 플래그

// ===== API 키 가져오기 =====

/**
 * config.js에 설정된 API 키를 반환합니다.
 * 원본 Python 코드의 load_dotenv() + os.getenv("YOUTUBE_API_KEY")와 동일한 역할입니다.
 */
function getApiKey() {
    if (typeof CONFIG !== 'undefined' && CONFIG.YOUTUBE_API_KEY) {
        const key = CONFIG.YOUTUBE_API_KEY.trim();
        // 기본 placeholder 값인 경우 미설정으로 간주
        if (key && key !== '여기에_API_키를_입력하세요') {
            return key;
        }
    }
    return '';
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    // config.js의 API 키 상태를 확인하여 뱃지에 표시
    checkApiKeyStatus();

    // Enter 키로 검색 실행
    document.getElementById('searchForm').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isSearching) {
            e.preventDefault();
            startSearch();
        }
    });
});

/**
 * config.js의 API 키 설정 여부를 확인하고 UI에 반영합니다.
 */
function checkApiKeyStatus() {
    const statusEl = document.getElementById('apiKeyStatus');
    const iconEl = document.getElementById('apiStatusIcon');
    const textEl = document.getElementById('apiStatusText');

    const apiKey = getApiKey();

    if (apiKey) {
        statusEl.className = 'api-key-status connected';
        iconEl.textContent = '✅';
        // API 키의 앞 4자만 보여주고 나머지는 마스킹
        const maskedKey = apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
        textEl.textContent = `API 키 연결됨 (${maskedKey})`;
    } else {
        statusEl.className = 'api-key-status disconnected';
        iconEl.textContent = '❌';
        textEl.textContent = 'API 키 미설정 — config.js 파일을 확인해 주세요';
    }
}

// ===== 로그 관련 함수 =====

/**
 * 로그 패널에 메시지를 추가합니다.
 * @param {string} message - 출력할 메시지
 * @param {'info'|'success'|'warn'|'error'|'default'} type - 로그 타입
 */
function addLog(message, type = 'default') {
    const logPanel = document.getElementById('logPanel');
    const logContent = document.getElementById('logContent');
    const logContainer = document.getElementById('logContainer');

    // 로그 패널 표시
    logPanel.style.display = '';

    // 현재 시각 포맷
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // 로그 항목 생성
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-msg">${escapeHtml(message)}</span>
    `;

    logContent.appendChild(entry);

    // 자동 스크롤
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * 로그를 모두 지웁니다.
 */
function clearLog() {
    document.getElementById('logContent').innerHTML = '';
}

// ===== 유틸리티 함수 =====

/**
 * HTML 특수 문자를 이스케이프합니다.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * ISO 8601 재생시간을 사람이 읽기 쉬운 형식으로 변환합니다.
 * 예: "PT1H2M3S" -> "01:02:03"
 */
function formatDuration(isoDuration) {
    if (!isoDuration) return '00:00:00';
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '00:00:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 숫자를 한국식으로 포맷합니다.
 * 예: 1234567 -> "1,234,567"
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('ko-KR');
}

/**
 * 큰 숫자를 축약형으로 표시합니다.
 * 예: 1234567 -> "123.5만"
 */
function formatNumberShort(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '억';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + '천';
    }
    return num.toString();
}

// ===== 메인 검색 로직 =====

/**
 * 검색을 시작합니다. 버튼 클릭 시 호출됩니다.
 */
async function startSearch() {
    if (isSearching) return;

    // config.js에서 API 키 읽기 (환경변수 방식)
    const apiKey = getApiKey();
    const searchQuery = document.getElementById('searchQuery').value.trim();
    const channelId = document.getElementById('channelId').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // ---- 유효성 검증 ----
    if (!apiKey) {
        alert('⚠️ API 키가 설정되지 않았습니다.\n\nconfig.js 파일을 열어서 YOUTUBE_API_KEY에 API 키를 입력해 주세요.');
        return;
    }

    if (!searchQuery && !channelId) {
        alert('⚠️ 검색어와 채널 ID 중 하나 이상은 반드시 입력해야 합니다.');
        document.getElementById('searchQuery').focus();
        return;
    }

    // ---- UI 상태 변경 ----
    isSearching = true;
    const searchBtn = document.getElementById('searchBtn');
    const btnText = searchBtn.querySelector('.btn-text');
    const btnLoader = document.getElementById('searchLoader');

    searchBtn.disabled = true;
    btnText.textContent = '검색 중...';
    btnLoader.style.display = '';

    // 이전 결과 초기화
    collectedVideos = [];
    clearLog();
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('resultsPanel').style.display = 'none';
    document.getElementById('resultsBody').innerHTML = '';

    addLog('검색 조건으로 유튜브 검색을 시작합니다...', 'info');

    try {
        // ---- YouTube Search API 호출 ----
        await fetchYouTubeData(apiKey, searchQuery, channelId, startDate, endDate);

        if (collectedVideos.length > 0) {
            // 통계 및 결과 표시
            showStats();
            showResults();
            addLog(`총 ${collectedVideos.length}개의 동영상 정보를 수집했습니다!`, 'success');
        } else {
            addLog('검색 결과가 없습니다.', 'warn');
            alert('검색 결과가 없습니다. 검색 조건을 확인해 주세요.');
        }
    } catch (error) {
        addLog(`[에러] ${error.message}`, 'error');
        alert(`❌ 오류가 발생했습니다.\n\n${error.message}`);
    } finally {
        // ---- UI 상태 복원 ----
        isSearching = false;
        searchBtn.disabled = false;
        btnText.textContent = '검색 시작';
        btnLoader.style.display = 'none';
    }
}

/**
 * YouTube Data API v3를 호출하여 동영상 데이터를 수집합니다.
 */
async function fetchYouTubeData(apiKey, searchQuery, channelId, startDate, endDate) {
    let nextPageToken = null;
    let totalFetched = 0;
    const maxResults = 200;

    while (true) {
        // ---- 검색 URL 구성 ----
        const params = new URLSearchParams({
            key: apiKey,
            part: 'snippet',
            maxResults: '50',
            type: 'video',
            order: 'date'
        });

        if (searchQuery) params.set('q', searchQuery);
        if (channelId) params.set('channelId', channelId);

        if (startDate) {
            params.set('publishedAfter', `${startDate}T00:00:00Z`);
        }
        if (endDate) {
            params.set('publishedBefore', `${endDate}T23:59:59Z`);
        }
        if (nextPageToken) {
            params.set('pageToken', nextPageToken);
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

        addLog('검색 API를 호출하는 중입니다...', 'info');

        // ---- Search API 호출 ----
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            const errorData = await searchResponse.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || `HTTP ${searchResponse.status}`;
            throw new Error(`검색 API 오류: ${errorMsg}`);
        }

        const searchData = await searchResponse.json();
        nextPageToken = searchData.nextPageToken || null;

        const items = searchData.items || [];
        if (items.length === 0) {
            addLog('더 이상 검색 결과가 없습니다.', 'info');
            break;
        }

        addLog(`이번 페이지에서 ${items.length}개의 결과를 가져왔습니다.`, 'info');

        // ---- 동영상 ID 목록 추출 (배치로 상세 조회) ----
        const videoIds = items
            .filter(item => item.id && item.id.videoId)
            .map(item => item.id.videoId);

        if (videoIds.length === 0) break;

        // ---- Videos API 배치 호출 (최대 50개씩) ----
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({
            key: apiKey,
            id: videoIds.join(','),
            part: 'contentDetails,statistics,snippet'
        }).toString()}`;

        addLog(`${videoIds.length}개 동영상 상세 정보 조회 중...`, 'info');

        const detailsResponse = await fetch(detailsUrl);
        if (!detailsResponse.ok) {
            const errorData = await detailsResponse.json().catch(() => ({}));
            addLog(`[경고] 상세 정보 조회 실패: ${errorData?.error?.message || 'Unknown'}`, 'warn');
            totalFetched += items.length;

            if (!nextPageToken || totalFetched >= maxResults) break;
            continue;
        }

        const detailsData = await detailsResponse.json();

        for (const video of (detailsData.items || [])) {
            const snippet = video.snippet || {};
            const contentDetails = video.contentDetails || {};
            const statistics = video.statistics || {};

            const videoId = video.id;
            const title = snippet.title || '';
            const channelTitle = snippet.channelTitle || '';
            const channelIdValue = snippet.channelId || '';
            const duration = formatDuration(contentDetails.duration);
            const views = parseInt(statistics.viewCount || '0', 10);
            const comments = parseInt(statistics.commentCount || '0', 10);
            const tags = (snippet.tags || []).join(', ');
            const thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '';
            const publishedAt = snippet.publishedAt || '';
            const publishedDate = publishedAt ? publishedAt.substring(0, 10) : '';

            collectedVideos.push({
                index: collectedVideos.length + 1,
                title,
                channelTitle,
                channelId: channelIdValue,
                duration,
                views,
                comments,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnailUrl,
                tags,
                publishedDate
            });
        }

        addLog(`현재까지 총 ${collectedVideos.length}개의 동영상을 수집했습니다.`, 'success');

        totalFetched += items.length;

        // 더 이상 다음 페이지가 없거나 최대치에 도달하면 중단
        if (!nextPageToken || totalFetched >= maxResults) {
            if (!nextPageToken) {
                addLog('모든 페이지를 조회했습니다.', 'info');
            } else {
                addLog(`최대 수집 개수(${maxResults})에 도달했습니다.`, 'info');
            }
            break;
        }

        // API 속도 제한 방지를 위해 짧은 딜레이
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// ===== 결과 표시 =====

/**
 * 통계 카드를 업데이트합니다.
 */
function showStats() {
    const section = document.getElementById('statsSection');
    section.style.display = '';

    const totalViews = collectedVideos.reduce((sum, v) => sum + v.views, 0);
    const totalComments = collectedVideos.reduce((sum, v) => sum + v.comments, 0);
    const avgViews = collectedVideos.length > 0 ? Math.round(totalViews / collectedVideos.length) : 0;

    // 숫자 카운팅 애니메이션
    animateValue('statTotalValue', 0, collectedVideos.length, 600);
    animateValue('statViewsValue', 0, totalViews, 800, true);
    animateValue('statCommentsValue', 0, totalComments, 700, true);
    animateValue('statAvgViewsValue', 0, avgViews, 900, true);
}

/**
 * 숫자 카운팅 애니메이션
 */
function animateValue(elementId, start, end, duration, useShort = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(start + (end - start) * eased);

        el.textContent = useShort ? formatNumberShort(current) : formatNumber(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // 최종값 정확히 표시
            el.textContent = useShort ? formatNumberShort(end) : formatNumber(end);
        }
    }

    requestAnimationFrame(update);
}

/**
 * 결과 테이블을 렌더링합니다.
 */
function showResults() {
    const panel = document.getElementById('resultsPanel');
    const tbody = document.getElementById('resultsBody');
    const countBadge = document.getElementById('resultCount');

    panel.style.display = '';
    countBadge.textContent = `${collectedVideos.length}건`;

    tbody.innerHTML = collectedVideos.map(video => `
        <tr>
            <td class="views-count">${video.index}</td>
            <td>
                <a href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(video.thumbnailUrl)}" 
                         alt="${escapeHtml(video.title)}" 
                         class="video-thumbnail"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2268%22><rect fill=%22%23333%22 width=%22120%22 height=%2268%22/><text x=%2260%22 y=%2238%22 fill=%22%23888%22 text-anchor=%22middle%22 font-size=%2212%22>No Image</text></svg>'">
                </a>
            </td>
            <td>
                <div class="video-title-cell">
                    <a href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer" class="video-title-link">
                        ${escapeHtml(video.title)}
                    </a>
                    ${video.tags ? `<span class="video-tags">🏷️ ${escapeHtml(video.tags)}</span>` : ''}
                </div>
            </td>
            <td>
                <div class="channel-name">${escapeHtml(video.channelTitle)}</div>
                <div class="channel-id">${escapeHtml(video.channelId)}</div>
            </td>
            <td><span class="duration-badge">${escapeHtml(video.duration)}</span></td>
            <td class="views-count" title="${formatNumber(video.views)}">${formatNumberShort(video.views)}</td>
            <td class="comments-count" title="${formatNumber(video.comments)}">${formatNumberShort(video.comments)}</td>
            <td class="date-cell">${escapeHtml(video.publishedDate)}</td>
        </tr>
    `).join('');

    // 결과 영역으로 스크롤
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== 엑셀 다운로드 =====

/**
 * 수집된 데이터를 엑셀 파일로 다운로드합니다.
 * SheetJS(xlsx) 라이브러리를 사용합니다.
 */
function downloadExcel() {
    if (collectedVideos.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }

    addLog('엑셀 파일 생성 중...', 'info');

    // 엑셀에 넣을 데이터 가공
    const excelData = collectedVideos.map(video => ({
        'Index': video.index,
        'Title': video.title,
        'Channel Title': video.channelTitle,
        'Channel ID': video.channelId,
        'Duration': video.duration,
        'Views': video.views,
        'Comments': video.comments,
        'URL': video.url,
        'Thumbnail URL': video.thumbnailUrl,
        'Tags': video.tags,
        'Published Date': video.publishedDate
    }));

    // SheetJS를 사용하여 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 열 너비 설정
    worksheet['!cols'] = [
        { wch: 6 },   // Index
        { wch: 50 },  // Title
        { wch: 20 },  // Channel Title
        { wch: 26 },  // Channel ID
        { wch: 10 },  // Duration
        { wch: 12 },  // Views
        { wch: 10 },  // Comments
        { wch: 45 },  // URL
        { wch: 50 },  // Thumbnail URL
        { wch: 40 },  // Tags
        { wch: 12 },  // Published Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'YouTube Results');

    // 파일명 구성
    const fileNameInput = document.getElementById('fileName').value.trim() || 'youtube_results';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fullFileName = `${fileNameInput}_${today}.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, fullFileName);

    addLog(`엑셀 파일 다운로드 완료: ${fullFileName}`, 'success');
}
