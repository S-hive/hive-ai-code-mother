package com.hive.hiveaicodemother.service;

import com.hive.hiveaicodemother.exception.BusinessException;
import com.hive.hiveaicodemother.exception.ErrorCode;
import com.hive.hiveaicodemother.model.dto.app.AppQueryRequest;
import com.hive.hiveaicodemother.model.entity.App;
import com.hive.hiveaicodemother.model.vo.AppVO;
import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.core.service.IService;

import java.util.List;

/**
 * 应用 服务层。
 *
 * @author <a href="https://github.com/S-hive">S-hive</a>
 */
public interface AppService extends IService<App> {

    /**
     * 获取应用封装类
     *
     * @param app
     * @return
     */
     AppVO getAppVO(App app);

    /**
     * 构造应用查询条件
     * @param appQueryRequest
     * @return
     */
     QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest);


    /**
     * 获取应用封装列表
     * @param appList
     * @return
     */
    List<AppVO> getAppVOList(List<App> appList);
}
