package com.hive.hiveaicodemother.common;

import lombok.Data;

import java.io.Serializable;

/**
 * 删除请求服装类
 */
@Data
public class DeleteRequest implements Serializable {

    /**
     * id
     */
    private Long id;

    private static final long serialVersionUID = 1L;
}
