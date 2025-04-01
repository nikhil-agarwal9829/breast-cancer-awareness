/*
 * Copyright 2022-present MongoDB, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef PHONGO_WRITECONCERN_H
#define PHONGO_WRITECONCERN_H

#include "mongoc/mongoc.h"

#include <php.h>

#define PHONGO_WRITE_CONCERN_W_MAJORITY "majority"

void phongo_writeconcern_init(zval* return_value, const mongoc_write_concern_t* write_concern);

const mongoc_write_concern_t* phongo_write_concern_from_zval(zval* zwrite_concern);

void php_phongo_write_concern_to_zval(zval* retval, const mongoc_write_concern_t* write_concern);

#endif /* PHONGO_WRITECONCERN_H */
