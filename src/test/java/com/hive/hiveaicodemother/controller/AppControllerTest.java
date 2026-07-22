package com.hive.hiveaicodemother.controller;

import com.hive.hiveaicodemother.common.BaseResponse;
import com.hive.hiveaicodemother.model.dto.app.AppDeployRequest;
import com.hive.hiveaicodemother.model.entity.User;
import com.hive.hiveaicodemother.service.AppService;
import com.hive.hiveaicodemother.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppControllerTest {

    @Mock
    private AppService appService;

    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AppController appController;

    @Test
    void deployAppReturnsAccessibleUrl() {
        long appId = 437080090502733824L;
        AppDeployRequest deployRequest = new AppDeployRequest();
        deployRequest.setAppId(appId);
        User loginUser = new User();
        loginUser.setId(123L);
        String deployUrl = "http://localhost/dCkZUL/";

        when(userService.getLoginUser(request)).thenReturn(loginUser);
        when(appService.deployApp(appId, loginUser)).thenReturn(deployUrl);

        BaseResponse<String> response = appController.deployApp(deployRequest, request);

        assertEquals(0, response.getCode());
        assertEquals(deployUrl, response.getData());
        verify(appService).deployApp(appId, loginUser);
    }
}
