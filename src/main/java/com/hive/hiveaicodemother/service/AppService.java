package com.hive.hiveaicodemother.service;

import com.hive.hiveaicodemother.model.dto.app.AppQueryRequest;
import com.hive.hiveaicodemother.model.entity.App;
import com.hive.hiveaicodemother.model.vo.AppVO;
import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.core.service.IService;

import java.util.List;

/**
 * 应用 服务层。
 *
 * @author <a href="https://github.com/liyupi">程序员鱼皮</a>
 */
public interface AppService extends IService<App> {

    /**
     * 查询App
     * @param app
     * @return
     */
    AppVO getAppVO(App app);

    /**
     * 构造应用查询条件
     *
     * @param appQueryRequest
     * @return
     */
    QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest);

    /**
     * 获取多个App信息
     * @param appList
     * @return
     */
    List<AppVO> getAppVOList(List<App> appList);
}