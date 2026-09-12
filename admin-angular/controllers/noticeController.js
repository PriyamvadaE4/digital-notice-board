app.controller('noticeController', function($scope, $http, API_BASE) {

    $scope.notice = {
        title: '',
        content: '',
        category: '',
        priority: 'Low',
        expiryDate: null
    };
    $scope.notices = [];
    $scope.error = "";
    $scope.success = "";
    $scope.isEditing = false;
    $scope.editingNoticeId = null;
    $scope.filters = {
        q: '',
        priority: 'All',
        category: 'All',
        sortBy: 'newest',
        activeOnly: true
    };
    $scope.categories = [];

    const getToken = function() {
        return localStorage.getItem("token");
    };

    const getRole = function() {
        return localStorage.getItem("role");
    };

    const canManageNotices = function() {
        return ['admin', 'faculty'].includes(getRole());
    };

    const authHeaders = function() {
        return {
            headers: {
                Authorization: 'Bearer ' + getToken()
            }
        };
    };

    const formatDateForInput = function(value) {
        if (!value) return null;
        return new Date(value).toISOString().slice(0, 10);
    };

    const extractNotices = function(payload) {
        if (Array.isArray(payload)) {
            return payload;
        }
        return payload.data || [];
    };

    $scope.loadNotices = function() {
        $scope.error = "";

        $http.get(API_BASE + '/notices', {
            params: {
                q: $scope.filters.q,
                priority: $scope.filters.priority,
                category: $scope.filters.category,
                sortBy: $scope.filters.sortBy,
                activeOnly: $scope.filters.activeOnly
            }
        })
        .then(function(response) {
            $scope.notices = extractNotices(response.data);

            const categoryMap = {};
            $scope.notices.forEach(function(n) {
                if (n.category) {
                    categoryMap[n.category] = true;
                }
            });
            $scope.categories = Object.keys(categoryMap);
        })
        .catch(function(error) {
            $scope.error = (error.data && error.data.message) || "Failed to load notices";
        });
    };

    $scope.saveNotice = function() {
        $scope.error = "";
        $scope.success = "";

        if (!canManageNotices()) {
            $scope.error = "Only admin or faculty can post notices";
            return;
        }

        if (!$scope.notice.title || !$scope.notice.content) {
            $scope.error = "Title and content are required";
            return;
        }

        if (!getToken()) {
            $scope.error = "Please login first";
            return;
        }

        const request = $scope.isEditing
            ? $http.put(API_BASE + '/notices/' + $scope.editingNoticeId, $scope.notice, authHeaders())
            : $http.post(API_BASE + '/notices', $scope.notice, authHeaders());

        request.then(function() {
            $scope.success = $scope.isEditing ? "Notice updated" : "Notice created";
            $scope.resetForm();
            $scope.loadNotices();
        })
        .catch(function(error) {
            $scope.error = (error.data && error.data.message) || "Unable to save notice";
        });
    };

    $scope.startEdit = function(notice) {
        $scope.isEditing = true;
        $scope.editingNoticeId = notice._id;
        $scope.notice = {
            title: notice.title,
            content: notice.content,
            category: notice.category || '',
            priority: notice.priority || 'Low',
            expiryDate: formatDateForInput(notice.expiryDate)
        };
    };

    $scope.resetForm = function() {
        $scope.notice = {
            title: '',
            content: '',
            category: '',
            priority: 'Low',
            expiryDate: null
        };
        $scope.isEditing = false;
        $scope.editingNoticeId = null;
    };

    $scope.deleteNotice = function(id) {
        $scope.error = "";
        $scope.success = "";

        if (!getToken()) {
            $scope.error = "Please login first";
            return;
        }

        if (!window.confirm("Delete this notice?")) {
            return;
        }

        $http.delete(API_BASE + '/notices/' + id, authHeaders())
        .then(function() {
            $scope.success = "Notice deleted";
            $scope.loadNotices();
        })
        .catch(function(error) {
            $scope.error = (error.data && error.data.message) || "Unable to delete notice";
        });
    };

    $scope.applyFilters = function() {
        $scope.loadNotices();
    };

    $scope.clearFilters = function() {
        $scope.filters = {
            q: '',
            priority: 'All',
            category: 'All',
            sortBy: 'newest',
            activeOnly: true
        };
        $scope.loadNotices();
    };

    $scope.loadNotices();
});
