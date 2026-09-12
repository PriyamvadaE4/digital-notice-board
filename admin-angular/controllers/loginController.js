app.controller('loginController', function($scope, $http, API_BASE) {

    $scope.loginData = {};
    $scope.error = "";
    $scope.success = "";
    $scope.currentUser = {
        name: localStorage.getItem("name"),
        role: localStorage.getItem("role")
    };

    $scope.login = function() {

        $scope.error = "";
        $scope.success = "";

        if (!$scope.loginData.identifier || !$scope.loginData.password) {
            $scope.error = "Please enter both username/email and password";
            return;
        }

        const normalizedIdentifier = ($scope.loginData.identifier || "").trim();

        $http.post(API_BASE + '/auth/login', {
            identifier: normalizedIdentifier,
            email: normalizedIdentifier,
            username: normalizedIdentifier,
            password: $scope.loginData.password
        })
        .then(function(response) {

            // Save token in localStorage
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.user.role);
            localStorage.setItem("name", response.data.user.name);

            $scope.currentUser = response.data.user;
            $scope.success = "Login successful. You can now manage notices.";

        })
        .catch(function(error) {
            $scope.error = (error.data && error.data.message) || "Invalid credentials";
        });
    };

    $scope.logout = function() {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        $scope.currentUser = {};
        window.location.href = "index.html";
    };

});
